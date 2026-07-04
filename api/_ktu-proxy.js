import { parseTimetableCsv, normalizeSemester, normalizeSession, normalizeSlot } from "../src/lib/timetable.js";

const KTU_BASE = 'https://app.ktu.edu.in';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function browserHeaders(extra = {}) {
  return {
    'User-Agent': BROWSER_UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    ...extra,
  };
}

function collectCookies(headers, existing = {}) {
  const cookies = { ...existing };
  const setCookie = headers.get('set-cookie');
  if (setCookie) {
    // Node-fetch might return comma separated cookies or multiple headers
    const cookieHeaders = setCookie.split(/,(?=[^;]*=)/);
    for (const c of cookieHeaders) {
      const nameVal = c.split(';')[0];
      const eqIdx = nameVal.indexOf('=');
      if (eqIdx > 0) {
        cookies[nameVal.substring(0, eqIdx).trim()] = nameVal.substring(eqIdx + 1).trim();
      }
    }
  }
  return cookies;
}

function parseCookies(cookieStr) {
  const cookies = {};
  if (cookieStr) {
    cookieStr.split(';').forEach(c => {
      const parts = c.split('=');
      if (parts.length >= 2) {
        cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });
  }
  return cookies;
}

function cookieString(cookies) {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
}



export async function handleKtuProxy(body) {
  const { action, username, password, sessionCookie } = body;

  if (action === 'health') {
    return { success: true, status: 'online' };
  }

  if (action === 'ktu_health') {
    try {
      const res = await fetch(`${KTU_BASE}/login.htm`, {
        method: 'GET',
        headers: browserHeaders({ 'Sec-Fetch-Site': 'none' }),
      });
      return { success: res.ok, status: res.ok ? 'online' : 'offline' };
    } catch (err) {
      return { success: false, status: 'offline', error: err.message };
    }
  }

  if (action === 'login') {
    // Step 1: GET login page to extract CSRF token
    const loginPageRes = await fetch(`${KTU_BASE}/login.htm`, {
      headers: browserHeaders({ 'Sec-Fetch-Site': 'none' }),
    });
    const loginPageHtml = await loginPageRes.text();
    const cookies = collectCookies(loginPageRes.headers);

    const csrfMatch = loginPageHtml.match(/name="CSRF_TOKEN"[^>]*value="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    // Step 2: POST login
    const formData = new URLSearchParams();
    if (csrfToken) formData.append('CSRF_TOKEN', csrfToken);
    formData.append('username', username);
    formData.append('password', password);

    const loginRes = await fetch(`${KTU_BASE}/login.htm`, {
      method: 'POST',
      headers: browserHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieString(cookies),
        'Referer': `${KTU_BASE}/login.htm`,
        'Origin': KTU_BASE,
      }),
      body: formData.toString(),
      redirect: 'manual',
    });

    const resCookies = collectCookies(loginRes.headers, cookies);
    const status = loginRes.status;
    const location = loginRes.headers.get('location') || '';
    const allCookieStr = cookieString(resCookies);

    if (status >= 300 && status < 400 && !location.includes('login')) {
      return { success: true, sessionCookie: allCookieStr };
    }

    const loginBody = await loginRes.text();
    const bodyLooksAuthenticated = /studentProfile|dashboard|logout|home\.htm|studentDetailsView/i.test(loginBody)
      && !/name="username"|name="password"|login\.htm/i.test(loginBody);

    if (status === 200 && bodyLooksAuthenticated) {
      return { success: true, sessionCookie: allCookieStr };
    }

    // Verify session
    if (status === 200 && resCookies.JSESSIONID) {
      const verifyRes = await fetch(`${KTU_BASE}/eu/stu/studentDetailsView.htm`, {
        headers: browserHeaders({
          'Cookie': allCookieStr,
          'Referer': `${KTU_BASE}/home.htm`,
        }),
      });

      const verifyHtml = await verifyRes.text();
      const verified = verifyRes.status === 200
        && !verifyHtml.includes('login.htm')
        && (verifyHtml.includes('curriculamTab') || verifyHtml.includes('collapseFiveS') || verifyHtml.includes('CGPA'));

      if (verified) {
        return { success: true, sessionCookie: allCookieStr };
      }
    }

    const alertMatch = loginBody.match(/<div[^>]*class="[^"]*alert[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const errorMsg = alertMatch?.[1]?.replace(/<[^>]*>/g, '').trim();

    return { success: false, error: errorMsg || 'Login failed.' };
  }

  if (action === 'getStudentData') {
    if (!sessionCookie) {
      return { success: false, error: 'No session.' };
    }

    const res = await fetch(`${KTU_BASE}/eu/stu/studentDetailsView.htm`, {
      headers: browserHeaders({
        'Cookie': sessionCookie,
        'Referer': `${KTU_BASE}/home.htm`,
      }),
    });

    const html = await res.text();

    let cookieStr = sessionCookie;
    try {
      const updatedCookies = collectCookies(res.headers, parseCookies(sessionCookie));
      cookieStr = cookieString(updatedCookies);
    } catch (err) {
      console.error("[Vite Proxy] Failed to collect updated cookies:", err);
    }



    if (html.includes('login.htm') && !html.includes('curriculamTab')) {
      return { success: false, error: 'Session expired. Please login again.' };
    }

    // Extract student info
    const studentInfo = {};

    // Name from page header
    let nameMatch = html.match(/class="profile-title"[^>]*>\s*([^(\n\r\t]+?)\s*\(/i);
    if (!nameMatch) {
      nameMatch = html.match(/panel-title[^>]*>\s*([^(\n\r\t]+?)\s*\(/i);
    }
    if (!nameMatch) {
      nameMatch = html.match(/panel-heading[^>]*>[\s\S]*?<b>\s*([^(\n\r\t]+?)\s*\(/i);
    }
    if (nameMatch) studentInfo.name = nameMatch[1].trim();

    // Register number
    const regMatch = html.match(/\(([A-Z]{3}\d{2}[A-Z]{2}\d{3})\)/);
    if (regMatch) studentInfo.registerNumber = regMatch[1];

    // Branch
    const branchMatch = html.match(/Admitted Branch<\/span>\s*([\s\S]*?)&nbsp;/i);
    if (branchMatch) studentInfo.branch = branchMatch[1].replace(/<[^>]*>/g, '').trim();

    // Program
    const progMatch = html.match(/Admitted Program<\/span>\s*([\s\S]*?)&nbsp;/i);
    if (progMatch) studentInfo.program = progMatch[1].replace(/<[^>]*>/g, '').trim();

    // Current semester
    const curSemMatch = html.match(/Current Semester<\/span>\s*([\s\S]*?)&nbsp;/i);
    if (curSemMatch) studentInfo.currentSemester = curSemMatch[1].replace(/<[^>]*>/g, '').trim();

    // CGPA
    const cgpaMatch = html.match(/CGPA\s*:\s*<\/span>\s*([\d.]+)/i);
    if (cgpaMatch) studentInfo.cgpa = cgpaMatch[1];

    // Parse all semesters
    const semesters = {};

    for (let s = 1; s <= 8; s++) {
      const semKey = `S${s}`;
      const startMarker = `id="collapseFive${semKey}"`;
      const startIdx = html.indexOf(startMarker);
      if (startIdx < 0) continue;

      const nextMarkers = [`id="collapseFiveS${s + 1}"`, 'id="collapseFiveActivity"', '</div>\n\t\t\t\t\t\t\t\t\t</div>'];
      let endIdx = html.length;
      for (const nm of nextMarkers) {
        const idx = html.indexOf(nm, startIdx + 100);
        if (idx > 0 && idx < endIdx) endIdx = idx;
      }

      const semHtml = html.substring(startIdx, endIdx);
      const courses = [];

      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let trMatch;
      let sgpaVal = '';

      while ((trMatch = trRegex.exec(semHtml)) !== null) {
        const row = trMatch[1];
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const cols = [];
        let tdm;
        while ((tdm = tdRegex.exec(row)) !== null) {
          cols.push(tdm[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
        }

        if (cols.length >= 8) {
          const slotStr = cols[0] || '';
          const courseStr = cols[1];
          const creditStr = cols[2];
          const gradeStr = cols[7];
          const earnedCreditStr = cols.length > 8 ? cols[8] : '';
          const examDetailsStr = cols.length > 9 ? cols[9] : '';

          const courseMatch = courseStr.match(/([A-Z]{2,4}\d{3})\s*-\s*(.*)/);
          if (courseMatch) {
            courses.push({
              slot: slotStr,
              code: courseMatch[1],
              courseName: courseMatch[2].trim(),
              credits: creditStr,
              grade: gradeStr,
              earnedCredit: earnedCreditStr,
              examDetails: examDetailsStr,
            });
          }

          if (courses.length === 1 && cols.length > 10) {
            sgpaVal = cols[10].trim();
          }
        }
      }

      if (!sgpaVal) {
        const sgpaMatch = semHtml.match(/rowspan="?\d+"?[^>]*class="text-center"[^>]*>([\d.]+)/);
        if (sgpaMatch) sgpaVal = sgpaMatch[1];
      }

      if (courses.length > 0) {
        semesters[semKey] = { courses, sgpa: sgpaVal };
      }
    }

    // Parse all exam grade list queries and associate them with semester keys
    const examBlocks = html.split('<div class="well col-sm-12"');
    console.log("[Vite Proxy] Total exam blocks split:", examBlocks.length);
    const semesterQueries = {};
    for (let i = 1; i < examBlocks.length; i++) {
      const block = examBlocks[i];
      const labelMatch = block.match(/<label[^>]*>\s*([^<]+?)\s*<\/label>/);
      const queryMatch = block.match(/href="\/eu\/res\/viewGradeList\.htm\?query=([^"'\s>]+)"/);
      if (labelMatch && queryMatch) {
        const label = labelMatch[1];
        const query = queryMatch[1];
        const semMatch = label.match(/S(\d)/i);
        if (semMatch) {
          const semKey = `S${semMatch[1]}`;
          if (!semesterQueries[semKey]) {
            semesterQueries[semKey] = [];
          }
          semesterQueries[semKey].push(query);
        }
      }
    }
    console.log("[Vite Proxy] Semester queries mapped:", Object.keys(semesterQueries));

    return { success: true, studentInfo, semesters };
  }

  throw new Error("Invalid action");
}

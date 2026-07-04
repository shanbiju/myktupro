// emSign Root CA - G1 (root) and emSign SSL CA - G1 (intermediate)
// KTU uses emSign certificates which are not in Deno's default CA bundle
const EMSIGN_ROOT_CA_G1 = `-----BEGIN CERTIFICATE-----
MIIDlDCCAnygAwIBAgIKMfXkYgxsWO3W2DANBgkqhkiG9w0BAQsFADBnMQswCQYD
VQQGEwJJTjETMBEGA1UECxMKZW1TaWduIFBLSTElMCMGA1UEChMcZU11ZGhyYSBU
ZWNobm9sb2dpZXMgTGltaXRlZDEcMBoGA1UEAxMTZW1TaWduIFJvb3QgQ0EgLSBH
MTAeFw0xODAyMTgxODMwMDBaFw00MzAyMTgxODMwMDBaMGcxCzAJBgNVBAYTAklO
MRMwEQYDVQQLEwplbVNpZ24gUEtJMSUwIwYDVQQKExxlTXVkaHJhIFRlY2hub2xv
Z2llcyBMaW1pdGVkMRwwGgYDVQQDExNlbVNpZ24gUm9vdCBDQSAtIEcxMIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAk0u76WaK7p1b1TST0Bsew+eeuGQz
f2N4aLTNLnF115sgxk0pvLZoYIr3IZpWNVrzdr3YzZr/k1ZLpVkGoZM0Kd0WNHVO
8oG0x5ZOrRkVUkr+PHB1cM2vK6sVmjM8qrOLqs1D/fXqcP/tzxE7lM5OMhbTI0Aq
d7OvPAEsbO2ZLIvZTmmYsvePQbAyeGHWDV/D+qJAkh1cF+ZwPjXnorfCYuKrpDhM
tTk1b+oDafo6VGiFbdbyL0NVHpENDtjVaqSW0RM8LHhQ6DqS0hdW5TUaQBw+jSzt
Od9C4INBdN+jzcKGYEho42kLVACL5HZpIQ15TjQIXhTCzLG3rdd8cIrHhQIDAQAB
o0IwQDAdBgNVHQ4EFgQU++8Nhp6w492pufEhF38+/PB3KxowDgYDVR0PAQH/BAQD
AgEGMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAFn/8oz1h31x
PaOfG1vR2vjTnGs2vZupYeveFix0PZ7mddrXuqe8QhfnPZHr5X3dPpzxz5KsbEjM
wiI/aTvFthUvozXGaCocV685743QNcMYDHsAVhzNixl03r4PEuDQqqE/AjSxcM6d
GNYIAwlG7mDgfrbESQRRfXBgvKqy/3lyeqYdPV8q+Mri/Tm3R7nrft8EI6/6nAYH
6ftjk4BAtcZsCjEozgyfz7MjNYBBjWzEN3uBL4ChQEKF6dk4jeihU80Bv2noWgby
RQuQ+q7hv53yrlc8pa6yVvSLZUDp/TGBLPQ5Cdjua6e0ph0VpZj3AYHYhX3zUVxx
iN66zB+Afko=
-----END CERTIFICATE-----`;

const EMSIGN_SSL_CA_G1 = `-----BEGIN CERTIFICATE-----
MIIEgjCCA2qgAwIBAgIKIXrVixxxPAAgkTANBgkqhkiG9w0BAQsFADBnMQswCQYD
VQQGEwJJTjETMBEGA1UECxMKZW1TaWduIFBLSTElMCMGA1UEChMcZU11ZGhyYSBU
ZWNobm9sb2dpZXMgTGltaXRlZDEcMBoGA1UEAxMTZW1TaWduIFJvb3QgQ0EgLSBH
MTAeFw0xODAyMTgxODMwMDBaFw0zMzAyMTgxODMwMDBaMGYxCzAJBgNVBAYTAklO
MRMwEQYDVQQLEwplbVNpZ24gUEtJMSUwIwYDVQQKExxlTXVkaHJhIFRlY2hub2xv
Z2llcyBMaW1pdGVkMRswGQYDVQQDExJlbVNpZ24gU1NMIENBIC0gRzEwggEiMA0G
CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCU1fhvfUV6OJOhMHAzBZDvxxpa5bvT
S1x6S4rVQmP/+125Wj2gpxvtII2RyqXQFlZd3qAKMLgqgHGzeJcyjw6CXbzJHmri
liVGWmuLn/NUKjKJgP9zd6eGOHe6mT1WjB9ZZEFLsDYoXBthTwcHdLWK2quJrHgS
3hZiJnpkX+hmaY7DX89oUMI1uvCQaPljgTvtiR9vtmeg/GgyePX8K5EUMozX8ElR
DMWkzdFUYv0DVcSQcbN1R/IDhWW1vPHzU8kexAMO4B/E5sj6FGrAeMM36/uZ3AmF
4mt/0Ia2BKPsW/K2T3hkaNSTr2BKlUm6bRccONcNAyzyN258xcUcX+RJAgMBAAGj
ggEvMIIBKzAfBgNVHSMEGDAWgBT77w2GnrDj3am58SEXfz788HcrGjAdBgNVHQ4E
FgQUNNH3OTJFQEqZK32JaldprZWv4zcwDgYDVR0PAQH/BAQDAgEGMB0GA1UdJQQW
MBQGCCsGAQUFBwMBBggrBgEFBQcDAjA9BgNVHSAENjA0MDIGBFUdIAAwKjAoBggr
BgEFBQcCARYcaHR0cDovL3JlcG9zaXRvcnkuZW1zaWduLmNvbTASBgNVHRMBAf8E
CDAGAQH/AgEAMDIGCCsGAQUFBwEBBCYwJDAiBggrBgEFBQcwAYYWaHR0cDovL29j
c3AuZW1zaWduLmNvbTAzBgNVHR8ELDAqMCigJqAkhiJodHRwOi8vY3JsLmVtc2ln
bi5jb20/Um9vdENBRzEuY3JsMA0GCSqGSIb3DQEBCwUAA4IBAQAaBDZfBK+cP9Zk
lI7QN3mkpgD+mYfp/03P51cUNlfAFoYd1G/4lU468rg7JLTwqFXcDzcmrWt8lmdi
AMflxwLGeNObNS9RkpdiMDCdRItCHq00IMbbzj5rz+HSzAn6WsbLn9efn9WhO1MO
72d1SsEbVOTw/Z3sfPpWS8DSp91TRZuRKReVmD967QnsQGYNKUG6esTV73dOigHC
ndwglIXCUkaxTroFn7wT6Sqt9pklaqxBkEx/yzp0HxpZtC8uK6aOFx624S9yF8nk
6U7rbscn4kJYOF+0U9JshFkQ4+cx5kKd3cGNtmaTzemoZSGn+Aty6H6/oDPteLpE
cUPckzSa
-----END CERTIFICATE-----`;

let httpClient: Deno.HttpClient | undefined;
try {
  httpClient = Deno.createHttpClient({
    caCerts: [EMSIGN_ROOT_CA_G1, EMSIGN_SSL_CA_G1],
  });
} catch (e) {
  console.error('Failed to create HTTP client with custom CA certs:', e);
}

async function ktuFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const timeoutMs = 20000;
  const signal = init.signal ?? AbortSignal.timeout(timeoutMs);
  const finalInit = { ...init, signal };

  try {
    if (httpClient) {
      return await fetch(url, { ...finalInit, client: httpClient } as any);
    }
    return await fetch(url, finalInit);
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      throw new Error(`KTU server timeout after ${timeoutMs / 1000}s`);
    }
    throw error;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const KTU_BASE = 'https://app.ktu.edu.in';

// Browser-like headers required by KTU portal (Sec-Fetch-* headers are mandatory)
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function browserHeaders(extra: Record<string, string> = {}): Record<string, string> {
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

// Helper to collect all cookies from a response
function collectCookies(res: Response, existing: Record<string, string> = {}): Record<string, string> {
  const cookies = { ...existing };
  for (const c of (res.headers.getSetCookie?.() || [])) {
    const nameVal = c.split(';')[0];
    const eqIdx = nameVal.indexOf('=');
    if (eqIdx > 0) cookies[nameVal.substring(0, eqIdx)] = nameVal.substring(eqIdx + 1);
  }
  return cookies;
}



function cookieString(cookies: Record<string, string>): string {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
}

function parseCookies(cookieStr: string): Record<string, string> {
  const cookies: Record<string, string> = {};
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, username, password, sessionCookie, examId, semesterId, csrfToken: clientCsrf } = await req.json();

    if (action === 'health') {
      return new Response(
        JSON.stringify({ success: true, status: 'online', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'ktu_health') {
      try {
        const res = await ktuFetch(`${KTU_BASE}/login.htm`, {
          method: 'GET',
          headers: browserHeaders({ 'Sec-Fetch-Site': 'none' }),
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          return new Response(
            JSON.stringify({ success: true, status: 'online', timestamp: new Date().toISOString() }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, status: 'offline', error: `HTTP ${res.status}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, status: 'offline', error: err instanceof Error ? err.message : 'Timeout' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'login') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      if (supabaseUrl && serviceRoleKey) {
        try {
          const enabledRes = await fetch(`${supabaseUrl}/rest/v1/admin_settings?key=eq.restrict_login_enabled&select=value`, {
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            }
          });
          if (enabledRes.ok) {
            const enabledData = await enabledRes.json();
            if (enabledData?.[0]?.value === 'true') {
              const checkRes = await fetch(`${supabaseUrl}/rest/v1/admin_settings?key=eq.allowed_register_numbers&select=value`, {
                headers: {
                  apikey: serviceRoleKey,
                  Authorization: `Bearer ${serviceRoleKey}`,
                }
              });
              if (checkRes.ok) {
                const checkData = await checkRes.json();
                const allowedVal = checkData?.[0]?.value;
                if (allowedVal) {
                  const allowedList = allowedVal.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean);
                  if (allowedList.length > 0 && !allowedList.includes(username.trim().toUpperCase())) {
                    return new Response(
                      JSON.stringify({ success: false, error: 'Your register number is not allowed to login. Please contact admin.' }),
                      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Error checking allowed register numbers:", e);
        }
      }

      // Step 1: GET login page to extract cookies and CSRF token
      const loginPageRes = await ktuFetch(`${KTU_BASE}/login.htm`, {
        headers: browserHeaders({ 'Sec-Fetch-Site': 'none' }),
        redirect: 'manual',
      });
      const loginPageHtml = await loginPageRes.text();
      const cookies = collectCookies(loginPageRes);

      const csrfMatch = loginPageHtml.match(/name="CSRF_TOKEN"[^>]*value="([^"]+)"/);
      const csrfToken = csrfMatch ? csrfMatch[1] : '';
      console.log('Login: cookies:', Object.keys(cookies).join(', '), 'CSRF:', csrfToken ? 'found' : 'missing');

      // Step 2: POST login
      const formData = new URLSearchParams();
      if (csrfToken) formData.append('CSRF_TOKEN', csrfToken);
      formData.append('username', username);
      formData.append('password', password);

      const loginRes = await ktuFetch(`${KTU_BASE}/login.htm`, {
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

      const resCookies = collectCookies(loginRes, cookies);
      const location = loginRes.headers.get('location') || '';
      const status = loginRes.status;
      console.log('Login response:', status, 'Location:', location);

      const allCookieStr = cookieString(resCookies);

      if (status >= 300 && status < 400 && !location.includes('login')) {
        return new Response(
          JSON.stringify({ success: true, sessionCookie: allCookieStr }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const loginBody = await loginRes.text();
      const bodyLooksAuthenticated = /studentProfile|dashboard|logout|home\.htm|studentDetailsView/i.test(loginBody)
        && !/name="username"|name="password"|login\.htm/i.test(loginBody);

      if (status === 200 && bodyLooksAuthenticated) {
        return new Response(
          JSON.stringify({ success: true, sessionCookie: allCookieStr }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fallback: some successful logins return HTTP 200 without obvious markers.
      // Verify session by loading a protected page using returned cookies.
      if (status === 200 && resCookies.JSESSIONID) {
        const verifyRes = await ktuFetch(`${KTU_BASE}/eu/stu/studentDetailsView.htm`, {
          headers: browserHeaders({
            'Cookie': allCookieStr,
            'Referer': `${KTU_BASE}/home.htm`,
          }),
          redirect: 'manual',
        });

        const verifyHtml = await verifyRes.text();
        const verified = verifyRes.status === 200
          && !verifyHtml.includes('login.htm')
          && (verifyHtml.includes('curriculamTab') || verifyHtml.includes('collapseFiveS') || verifyHtml.includes('CGPA'));

        if (verified) {
          return new Response(
            JSON.stringify({ success: true, sessionCookie: allCookieStr }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const alertMatch = loginBody.match(/<div[^>]*class="[^"]*alert[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const errorMsg = alertMatch?.[1]?.replace(/<[^>]*>/g, '').trim();

      return new Response(
        JSON.stringify({ success: false, error: errorMsg || 'Login failed.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unified action: fetch studentDetailsView.htm and parse all data
    if (action === 'getStudentData') {
      if (!sessionCookie) {
        return new Response(
          JSON.stringify({ success: false, error: 'No session.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const res = await ktuFetch(`${KTU_BASE}/eu/stu/studentDetailsView.htm`, {
        headers: browserHeaders({
          'Cookie': sessionCookie,
          'Referer': `${KTU_BASE}/home.htm`,
        }),
      });

      const html = await res.text();
      let cookieStr = sessionCookie;
      try {
        const updatedCookies = collectCookies(res, parseCookies(sessionCookie));
        cookieStr = cookieString(updatedCookies);
      } catch (err) {
        console.error("[Edge Function] Failed to collect updated cookies:", err);
      }

      if (html.includes('login.htm') && !html.includes('curriculamTab')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Session expired. Please login again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract student info
      const studentInfo: Record<string, string> = {};

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
      type CourseResult = { slot: string; courseName: string; code: string; credits: string; grade: string; earnedCredit: string; examDetails: string };
      type SemesterData = { courses: CourseResult[]; sgpa: string };
      const semesters: Record<string, SemesterData> = {};

      // Find each semester section
      for (let s = 1; s <= 8; s++) {
        const semKey = `S${s}`;
        const startMarker = `id="collapseFive${semKey}"`;
        const startIdx = html.indexOf(startMarker);
        if (startIdx < 0) continue;

        // Find the end of this section (next collapseFive or end of accordion)
        const nextMarkers = [`id="collapseFiveS${s + 1}"`, 'id="collapseFiveActivity"', '</div>\n\t\t\t\t\t\t\t\t\t</div>'];
        let endIdx = html.length;
        for (const nm of nextMarkers) {
          const idx = html.indexOf(nm, startIdx + 100);
          if (idx > 0 && idx < endIdx) endIdx = idx;
        }

        const semHtml = html.substring(startIdx, endIdx);
        const courses: CourseResult[] = [];

        // Parse table rows - each row has: Slot, Course, Credits, Valuation, Completed, Eligible, Re-Reg, Grade, Earned Credit, Exam Details, SGPA
        // We extract: Course (col2), Credits (col3), Grade (col8), Earned Credit (col9), Exam Details (col10)
        const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let trMatch;
        let sgpaVal = '';

        while ((trMatch = trRegex.exec(semHtml)) !== null) {
          const row = trMatch[1];
          // Extract all td values
          const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
          const cols: string[] = [];
          let tdm;
          while ((tdm = tdRegex.exec(row)) !== null) {
            cols.push(tdm[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
          }

          if (cols.length >= 8) {
            // col[0]=Slot, col[1]=Course, col[2]=Credits, col[3]=Valuation, col[4]=Completed, col[5]=Eligible, col[6]=Re-Reg, col[7]=Grade
            const slotStr = cols[0] || '';
            const courseStr = cols[1];
            const creditStr = cols[2];
            const gradeStr = cols[7];
            const earnedCreditStr = cols.length > 8 ? cols[8] : '';
            const examDetailsStr = cols.length > 9 ? cols[9] : '';

            // Parse course code and name from "EET401 - ADVANCED CONTROL SYSTEMS"
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

            // SGPA is in the last column of the first row (rowspan)
            if (courses.length === 1 && cols.length > 10) {
              sgpaVal = cols[10].trim();
            }
          }
        }

        // Also try to find SGPA from rowspan td that might not be in regular rows
        if (!sgpaVal) {
          const sgpaMatch = semHtml.match(/rowspan="?\d+"?[^>]*class="text-center"[^>]*>([\d.]+)/);
          if (sgpaMatch) sgpaVal = sgpaMatch[1];
        }

        if (courses.length > 0) {
          semesters[semKey] = { courses, sgpa: sgpaVal };
        }
      }

      console.log('Parsed student:', studentInfo.name, 'Semesters:', Object.keys(semesters).join(', '));

      // Parse all exam grade list queries and associate them with semester keys
      const examBlocks = html.split('<div class="well col-sm-12"');
      const semesterQueries: Record<string, string[]> = {};
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

      return new Response(
        JSON.stringify({ success: true, studentInfo, semesters }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Server error. KTU may be down.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

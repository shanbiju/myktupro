import crypto from "node:crypto";

// KTU API currently serves an invalid cert chain in some environments.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const KTU_WEBPORTAL_API_URI = "https://api.ktu.edu.in/ktu-web-portal-api/anon";
const KTU_BASE_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/plain, */*",
  Origin: "https://ktu.edu.in",
  Referer: "https://ktu.edu.in/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
};

const KTU_ENDPOINTS = {
  RECAPTCHA_SCRIPT: `${KTU_WEBPORTAL_API_URI}/get?key=v3`,
  WEBLOGS: `${KTU_WEBPORTAL_API_URI}/Weblogs`,
  ANNOUNCEMENTS: `${KTU_WEBPORTAL_API_URI}/announcemnts`,
  ATTACHMENT: `${KTU_WEBPORTAL_API_URI}/getAttachment`,
};

function stripHtml(input) {
  if (!input) return "";
  return String(input).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parseCfgIndex(scriptText) {
  const match = String(scriptText || "").match(/window\.cfg\s*=\s*'?(?<cfg>\d+)'?/);
  return Number(match?.groups?.cfg || 0);
}

function deriveAdEncParts(adEnc) {
  const saltPrefix = adEnc.substring(0, 10);
  const saltRemainder = adEnc.substring(10);
  const key = crypto.pbkdf2Sync(saltPrefix, saltRemainder, 1000, 32, "sha256");
  const iv = crypto.pbkdf2Sync(saltPrefix, `${saltRemainder}iv`, 1000, 16, "sha256");
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(adEnc, "utf8", "base64");
  encrypted += cipher.final("base64");
  encrypted = encrypted.padEnd(53, "=");

  const chunks = [];
  for (let i = 0; i < 5; i += 1) {
    chunks.push(encrypted.substring(i * 10, (i + 1) * 10));
  }
  return chunks;
}

function pickTwoDistinct(items) {
  const firstIndex = Math.floor(Math.random() * items.length);
  let secondIndex = firstIndex;
  while (secondIndex === firstIndex) {
    secondIndex = Math.floor(Math.random() * items.length);
  }
  return [items[firstIndex], items[secondIndex]];
}

function insertMarkerChar(input, index) {
  const safeIndex = Math.max(0, Math.min(index, input.length));
  const marker = String.fromCharCode(65 + (safeIndex % 26));
  return `${input.slice(0, safeIndex)}${marker}${input.slice(safeIndex)}`;
}

async function getKtuTokenMeta() {
  const response = await fetch(KTU_ENDPOINTS.RECAPTCHA_SCRIPT, {
    method: "POST",
    headers: KTU_BASE_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`KTU token endpoint failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data?.key || !data?.adEnc) {
    throw new Error("KTU token metadata missing required fields");
  }

  return {
    siteKey: data.key,
    adEnc: data.adEnc,
    cfgIndex: parseCfgIndex(data.script),
  };
}

async function buildXToken() {
  const { siteKey, adEnc, cfgIndex } = await getKtuTokenMeta();
  const adEncParts = deriveAdEncParts(adEnc);
  const [random1, random2] = pickTwoDistinct(adEncParts);

  // Keep the same token shape KTU frontend generates. A real captcha token is not required
  // for announcements currently; format validation + weblog preflight are sufficient.
  const pseudoRecaptchaToken = `03AFcWeA${crypto.randomBytes(120).toString("base64url")}`;
  const mixedRecaptchaToken = insertMarkerChar(pseudoRecaptchaToken, cfgIndex);
  const xToken = `${random1}${mixedRecaptchaToken}${random2}++${siteKey}`;

  return { xToken, adEnc, random1, random2 };
}

async function sendPreflightLog({ xToken, adEnc, random1, random2 }) {
  const query = new URLSearchParams({
    adEnc,
    rData: `${random1}${random2}`,
    mS: "0",
    kS: "0",
    xtoken: xToken,
    tstamp: new Date().toISOString(),
  });

  try {
    await fetch(`${KTU_ENDPOINTS.WEBLOGS}?${query.toString()}`, { method: "POST" });
  } catch {
    // Non-blocking by design (same behavior as KTU frontend).
  }
}

async function postKtuJson(url, payload, xToken) {
  const response = await fetch(url, {
    method: "POST",
    headers: { ...KTU_BASE_HEADERS, "x-Token": xToken },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`KTU API ${response.status}: ${text || "request failed"}`);
  }

  return response.json();
}

function mapAnnouncements(apiRows) {
  return (apiRows || []).map((row, index) => {
    const subject = stripHtml(row?.subject);
    const message = stripHtml(row?.message);
    const attachment = Array.isArray(row?.attachmentList) ? row.attachmentList[0] : null;
    const encryptId = attachment?.encryptId || "";
    const attachmentName = attachment?.attachmentName || "attachment.pdf";

    return {
      id: String(row?.id || `ktu-${index}`),
      title: subject || message || "Announcement",
      subject,
      message,
      link: "https://ktu.edu.in/Menu/announcements",
      attachment_url: encryptId
        ? `/api/announcement-attachment?encryptId=${encodeURIComponent(encryptId)}&name=${encodeURIComponent(attachmentName)}&download=1`
        : "",
      published_date: row?.announcementDate || "",
    };
  });
}

export async function fetchKtuAnnouncements({
  pageNumber = 0,
  dataSize = 30,
  searchText = "",
} = {}) {
  const tokenMeta = await buildXToken();
  await sendPreflightLog(tokenMeta);

  const data = await postKtuJson(
    KTU_ENDPOINTS.ANNOUNCEMENTS,
    { number: pageNumber, size: dataSize, searchText },
    tokenMeta.xToken
  );

  return mapAnnouncements(data?.content || []).slice(0, 50);
}

export async function fetchKtuAttachmentBase64(encryptId) {
  if (!encryptId || !String(encryptId).trim()) {
    throw new Error("encryptId is required");
  }

  const tokenMeta = await buildXToken();
  await sendPreflightLog(tokenMeta);

  const response = await fetch(KTU_ENDPOINTS.ATTACHMENT, {
    method: "POST",
    headers: { ...KTU_BASE_HEADERS, "x-Token": tokenMeta.xToken },
    body: JSON.stringify({ encryptId }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`KTU attachment API ${response.status}: ${text || "request failed"}`);
  }

  const base64 = (await response.text()).trim();
  if (!base64) {
    throw new Error("Empty attachment data");
  }

  return base64;
}

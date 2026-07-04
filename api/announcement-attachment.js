import { fetchKtuAttachmentBase64 } from "./_ktu-client.js";

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sanitizeFileName(name) {
  const fallback = "announcement-attachment.pdf";
  const input = String(name || fallback).trim();
  const safe = input.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe || fallback;
}

function inferMimeType(fileName, base64Data) {
  if (/\.pdf$/i.test(fileName) || String(base64Data).startsWith("JVBERi0")) {
    return "application/pdf";
  }
  if (/\.png$/i.test(fileName)) {
    return "image/png";
  }
  if (/\.jpe?g$/i.test(fileName)) {
    return "image/jpeg";
  }
  return "application/octet-stream";
}

function normalizeBase64Payload(input) {
  let value = String(input || "").trim();
  const dataUriMatch = value.match(/^data:[^;]+;base64,(.+)$/i);
  if (dataUriMatch?.[1]) {
    value = dataUriMatch[1];
  }

  value = value.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!value) return "";

  const padLength = value.length % 4;
  if (padLength > 0) {
    value += "=".repeat(4 - padLength);
  }

  return value;
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  try {
    const encryptId = String(req.query?.encryptId || "").trim();
    if (!encryptId) {
      res.status(400).json({ success: false, error: "Missing encryptId" });
      return;
    }

    const forceDownload = String(req.query?.download || "1") !== "0";
    const fileName = sanitizeFileName(req.query?.name);
    const base64Data = normalizeBase64Payload(await fetchKtuAttachmentBase64(encryptId));
    if (!base64Data) {
      throw new Error("Attachment payload is empty");
    }

    const fileBuffer = Buffer.from(base64Data, "base64");
    if (!fileBuffer.length) {
      throw new Error("Attachment payload is invalid");
    }

    const mimeType = inferMimeType(fileName, base64Data);

    res.setHeader("Content-Type", mimeType);
    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader(
      "Content-Disposition",
      `${forceDownload ? "attachment" : "inline"}; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`
    );
    res.setHeader("Content-Length", String(fileBuffer.length));
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=600");
    res.status(200).send(fileBuffer);
  } catch (error) {
    console.error("Attachment error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Attachment fetch failed",
    });
  }
}

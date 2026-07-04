import { fetchKtuAnnouncements } from "./_ktu-client.js";

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
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
    const pageNumber = parsePositiveInt(req.query?.page, 0);
    const dataSize = Math.min(parsePositiveInt(req.query?.size, 30), 50);
    const searchText = String(req.query?.searchText || "");

    const announcements = await fetchKtuAnnouncements({
      pageNumber,
      dataSize,
      searchText,
    });

    res.status(200).json({
      success: true,
      source: "ktu-bot-style-api",
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    console.error("Announcements error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Server error",
    });
  }
}

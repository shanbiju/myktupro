import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  title: string;
  link: string | null;
  attachment_url: string | null;
  published_date: string | null;
  fetched_at: string;
}

function normalizeAnnouncement(item: any, index: number, prefix: string): Announcement {
  return {
    id: item?.id ? String(item.id) : `${prefix}-${index}`,
    title: item?.title || "Announcement",
    link: item?.link || null,
    attachment_url: item?.attachment_url || null,
    published_date: item?.published_date || "",
    fetched_at: item?.fetched_at || item?.created_at || new Date().toISOString(),
  };
}

export function announcementKey(announcement: Announcement): string {
  return [
    announcement.id,
    announcement.title,
    announcement.published_date || "",
    announcement.link || "",
    announcement.attachment_url || "",
  ].join("|");
}

export async function fetchKtuAnnouncements(): Promise<Announcement[]> {
  try {
    const res = await fetch("/api/announcements");
    if (!res.ok) throw new Error(`KTU API Error: ${res.status}`);

    const data = await res.json();
    if (!data || !Array.isArray(data.announcements)) return [];

    return data.announcements.map((item: any, i: number) => normalizeAnnouncement(item, i, "ktu"));
  } catch (error) {
    console.error("Failed to fetch KTU announcements:", error);
    return [];
  }
}

export async function fetchCustomAnnouncements(): Promise<Announcement[]> {
  try {
    const { data, error } = await supabase
      .from("admin_announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((item, i) =>
      normalizeAnnouncement(
        {
          ...item,
          title: `[Admin] ${item.title}`,
          attachment_url: null,
        },
        i,
        "custom"
      )
    );
  } catch (error) {
    console.error("Failed to fetch custom announcements:", error);
    return [];
  }
}

function parsePublishedDate(dStr: string | null): number {
  if (!dStr) return 0;
  const match = dStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    return new Date(year, month, day).getTime();
  }
  const t = Date.parse(dStr);
  return isNaN(t) ? 0 : t;
}

export async function fetchAllAnnouncements(): Promise<Announcement[]> {
  const [customAnnouncements, ktuAnnouncements] = await Promise.all([
    fetchCustomAnnouncements(),
    fetchKtuAnnouncements(),
  ]);

  const merged = [...customAnnouncements, ...ktuAnnouncements];
  const dedup = new Map<string, Announcement>();

  for (const ann of merged) {
    const key = announcementKey(ann);
    if (!dedup.has(key)) dedup.set(key, ann);
  }

  const sorted = Array.from(dedup.values()).sort((a, b) => {
    const aIsAdmin = a.id.startsWith("custom-");
    const bIsAdmin = b.id.startsWith("custom-");
    if (aIsAdmin && !bIsAdmin) return -1;
    if (!aIsAdmin && bIsAdmin) return 1;

    const timeA = parsePublishedDate(a.published_date);
    const timeB = parsePublishedDate(b.published_date);
    if (timeA !== timeB) return timeB - timeA;

    return new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime();
  });

  return sorted;
}

import * as https from "node:https";

function fetchInsecure(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const REST_BASE = `${SUPABASE_URL}/rest/v1`;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function restRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers({
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  });

  if (init.headers) {
    const incoming = new Headers(init.headers);
    incoming.forEach((value, key) => headers.set(key, value));
  }

  const res = await fetch(`${REST_BASE}/${path}`, {
    ...init,
    headers,
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return jsonResponse({ success: false, error: 'Server configuration missing' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'get';

    if (action === 'refresh') {
      let html = '';
      try {
        html = await fetchInsecure('https://ktu.edu.in/Menu/announcements');
      } catch (err) {
        console.error('Insecure fetch failed', err);
        throw err;
      }

      const announcements: Array<{
        title: string;
        link: string;
        attachment_url: string;
        published_date: string;
      }> = [];

      const itemRegex = /<li[^>]*class="[^"]*announcement[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
      let match: RegExpExecArray | null;

      while ((match = itemRegex.exec(html)) !== null) {
        const item = match[1];
        const titleMatch = item.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
        const dateMatch = item.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);

        if (titleMatch) {
          announcements.push({
            title: titleMatch[2].replace(/<[^>]*>/g, '').trim(),
            link: titleMatch[1].startsWith('http') ? titleMatch[1] : `https://ktu.edu.in${titleMatch[1]}`,
            attachment_url: '',
            published_date: dateMatch ? dateMatch[1] : '',
          });
        }
      }

      if (announcements.length === 0) {
        const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        while ((match = trRegex.exec(html)) !== null) {
          const row = match[1];
          const linkMatch = row.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
          const dateMatch = row.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
          const attachMatch = row.match(/<a[^>]*href="([^"]*\.pdf[^"]*)"[^>]*/i);

          if (linkMatch) {
            const title = linkMatch[2].replace(/<[^>]*>/g, '').trim();
            if (
              title.length > 5 &&
              !title.toLowerCase().includes('sl.no') &&
              !title.toLowerCase().includes('subject')
            ) {
              announcements.push({
                title,
                link: linkMatch[1].startsWith('http')
                  ? linkMatch[1]
                  : `https://ktu.edu.in${linkMatch[1]}`,
                attachment_url: attachMatch
                  ? attachMatch[1].startsWith('http')
                    ? attachMatch[1]
                    : `https://ktu.edu.in${attachMatch[1]}`
                  : '',
                published_date: dateMatch ? dateMatch[1] : '',
              });
            }
          }
        }
      }

      if (announcements.length === 0) {
        const contentMatch = html.match(/class="[^"]*content[^"]*"[^>]*>([\s\S]*?)(?=<footer|<\/main|$)/i);
        const content = contentMatch ? contentMatch[1] : html;
        const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

        while ((match = linkRegex.exec(content)) !== null) {
          const title = match[2].replace(/<[^>]*>/g, '').trim();
          if (
            title.length > 10 &&
            !title.includes('Home') &&
            !title.includes('About') &&
            !title.includes('Menu')
          ) {
            announcements.push({
              title,
              link: match[1].startsWith('http') ? match[1] : `https://ktu.edu.in${match[1]}`,
              attachment_url: '',
              published_date: '',
            });
          }
        }
      }

      if (announcements.length > 0) {
        await restRequest('ktu_announcements?id=neq.00000000-0000-0000-0000-000000000000', {
          method: 'DELETE',
        });

        await restRequest('ktu_announcements', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(
            announcements.slice(0, 50).map((a) => ({
              title: a.title.substring(0, 500),
              link: a.link,
              attachment_url: a.attachment_url,
              published_date: a.published_date,
              fetched_at: new Date().toISOString(),
            }))
          ),
        });
      }

      return jsonResponse({
        success: true,
        count: announcements.length,
        announcements: announcements.slice(0, 50),
      });
    }

    const data = await restRequest('ktu_announcements?select=*&order=fetched_at.desc&limit=50', {
      method: 'GET',
    });

    return jsonResponse({ success: true, announcements: data || [] });
  } catch (error) {
    console.error('Announcements error:', error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      500
    );
  }
});

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// Extract the most signal-rich parts of the HTML (head section + embedded JSON)
function extractSignals(html: string): string {
  // Get the <head> section — contains title, meta tags, og tags
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  const head = headMatch ? headMatch[0].slice(0, 3000) : html.slice(0, 3000);

  // Also grab any inline JSON data Instagram embeds (window._sharedData etc.)
  const dataMatch = html.match(/window\._sharedData\s*=\s*(\{[\s\S]{0,2000})/);
  const extraData = dataMatch ? dataMatch[1] : "";

  return (head + (extraData ? "\n\n[Embedded data]\n" + extraData : "")).slice(0, 4000);
}

async function accountExists(username: string): Promise<boolean> {
  if (username.toLowerCase().includes("__deleted__")) return false;

  let html = "";
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 404) return false;
    if (!res.ok) return true;

    html = await res.text();

    // Fast-path checks before calling Claude
    if (/<title>\s*Page Not Found/i.test(html)) return false;
    if (/og:title[^>]*Page Not Found/i.test(html)) return false;
  } catch {
    return true;
  }

  // Use Claude Haiku to analyze the page for subtle signals
  try {
    const signals = extractSignals(html);
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 5,
      system: [
        {
          type: "text",
          text: "You analyze Instagram page HTML to determine whether an account exists and is accessible. Look for signals in the title, meta tags, og:title, og:description, canonical URL, and any embedded JSON data. Signals that the account does NOT exist or is unavailable: title containing 'Page Not Found', meta description about a missing page, no user-specific data embedded, og:title mentioning unavailability. Respond with only YES (account exists/active) or NO (deleted/deactivated/unavailable).",
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Instagram username: @${username}\n\nPage signals:\n${signals}\n\nDoes this account exist? YES or NO:`,
        },
      ],
    });

    const answer =
      message.content[0].type === "text"
        ? message.content[0].text.trim().toUpperCase()
        : "YES";
    return !answer.startsWith("NO");
  } catch {
    // If Claude call fails, fall back to treating as active
    return true;
  }
}

// Run promises with a concurrency limit
async function pLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

export async function POST(request: Request) {
  try {
    const { usernames } = (await request.json()) as { usernames: string[] };

    if (!Array.isArray(usernames) || usernames.length === 0) {
      return Response.json({ error: "No usernames provided." }, { status: 400 });
    }

    const batch = usernames.slice(0, 50);

    const tasks = batch.map(
      (username) => async () => ({
        username,
        exists: await accountExists(username),
      })
    );

    // 5 concurrent checks — fast enough, avoids hammering Instagram or Claude rate limits
    const results = await pLimit(tasks, 5);

    return Response.json({ results });
  } catch (err) {
    console.error("Check accounts error:", err);
    return Response.json({ error: "Failed to check accounts." }, { status: 500 });
  }
}

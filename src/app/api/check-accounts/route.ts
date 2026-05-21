async function accountExists(username: string): Promise<boolean> {
  if (username.toLowerCase().includes("__deleted__")) return false;

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

    const text = await res.text();

    // Instagram server-renders "Page Not Found" in the <title> for deleted/unavailable accounts.
    // The "Sorry, this page isn't available" message is client-side JS, so we rely on the title instead.
    if (/<title>\s*Page Not Found/i.test(text)) return false;
    if (/og:title[^>]*Page Not Found/i.test(text)) return false;

    // If Instagram redirected us to the login page (no cookies on server)
    // the title will be "Login" — that means we can't confirm existence either way, keep it.
    // But if the page has no recognisable Instagram profile signals, mark as gone.
    const hasProfileSignal =
      new RegExp(`"username"\\s*:\\s*"${username}"`, "i").test(text) ||
      text.includes(`@${username}`) ||
      text.includes(`/${username}/`);

    // If the page has no mention of the username at all, it likely doesn't exist
    if (!hasProfileSignal) return false;

    return true;
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  try {
    const { usernames } = (await request.json()) as { usernames: string[] };

    if (!Array.isArray(usernames) || usernames.length === 0) {
      return Response.json({ error: "No usernames provided." }, { status: 400 });
    }

    const batch = usernames.slice(0, 50);
    const results = await Promise.all(
      batch.map(async (username) => ({
        username,
        exists: await accountExists(username),
      }))
    );

    return Response.json({ results });
  } catch (err) {
    console.error("Check accounts error:", err);
    return Response.json({ error: "Failed to check accounts." }, { status: 500 });
  }
}

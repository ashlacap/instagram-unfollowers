async function accountExists(username: string): Promise<boolean> {
  // Instagram renames deleted accounts with __deleted__ prefix
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
    if (res.status === 302 || res.status === 301) {
      // Redirect to login page means account may be private or deleted
      const location = res.headers.get("location") ?? "";
      if (location.includes("/accounts/login")) return false;
    }
    if (!res.ok) return true;

    const text = await res.text();
    if (
      text.includes("Sorry, this page") ||
      text.includes("page isn’t available") ||
      text.includes("page isn't available") ||
      text.includes("content unavailable")
    ) {
      return false;
    }
    return true;
  } catch {
    return true; // network/timeout — keep in list
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

async function accountExists(username: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404) return false;
    if (!res.ok) return true; // assume exists on other errors
    const text = await res.text();
    return !text.includes("Sorry, this page") && !text.includes("page isn't available");
  } catch {
    return true; // network error — assume exists
  }
}

export async function POST(request: Request) {
  try {
    const { usernames } = await request.json() as { usernames: string[] };

    if (!Array.isArray(usernames) || usernames.length === 0) {
      return Response.json({ error: "No usernames provided." }, { status: 400 });
    }

    // Check up to 50 at a time to avoid timeouts
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

import AdmZip from "adm-zip";
import {
  analyzeFollowers,
  parseFollowers,
  parseFollowing,
  type InstagramUser,
} from "@/lib/instagram";

function parseJson(content: Buffer | string): unknown {
  try {
    return JSON.parse(typeof content === "string" ? content : content.toString("utf-8"));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const allFollowers: InstagramUser[] = [];
    const allFollowing: InstagramUser[] = [];
    const pendingUsernames = new Set<string>();
    let foundFollowers = false;
    let foundFollowing = false;

    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    for (const entry of entries) {
      const name = entry.entryName.toLowerCase();
      const basename = name.split("/").pop() ?? name;

      if (/^followers(_\d+)?\.json$/.test(basename)) {
        const content = entry.getData();
        const json = parseJson(content);
        if (json) {
          allFollowers.push(...parseFollowers(json));
          foundFollowers = true;
        }
      }

      if (/^following(_\d+)?\.json$/.test(basename)) {
        const content = entry.getData();
        const json = parseJson(content);
        if (json) {
          allFollowing.push(...parseFollowing(json));
          foundFollowing = true;
        }
      }

      // Collect pending follow requests so we can exclude them
      if (basename === "pending_follow_requests.json") {
        const content = entry.getData();
        const json = parseJson(content);
        if (json) {
          parseFollowing(json).forEach((u) =>
            pendingUsernames.add(u.username.toLowerCase())
          );
        }
      }
    }

    // Remove pending requests and Instagram-renamed deleted accounts
    const confirmedFollowing = allFollowing.filter((u) => {
      const lower = u.username.toLowerCase();
      if (pendingUsernames.has(lower)) return false;
      if (lower.includes("__deleted__")) return false;
      return true;
    });

    if (!foundFollowers && !foundFollowing) {
      return Response.json(
        { error: "Could not find followers or following data. Make sure you uploaded the correct Instagram data export ZIP (JSON format)." },
        { status: 422 }
      );
    }

    if (!foundFollowers) {
      return Response.json(
        { error: "Followers file not found in the ZIP. Expected 'followers_and_following/followers_1.json'." },
        { status: 422 }
      );
    }

    if (!foundFollowing) {
      return Response.json(
        { error: "Following file not found in the ZIP. Expected 'followers_and_following/following.json'." },
        { status: 422 }
      );
    }

    const result = analyzeFollowers(allFollowers, confirmedFollowing);
    return Response.json(result);
  } catch (err) {
    console.error("Analyze error:", err);
    return Response.json(
      { error: "Failed to process the file. Make sure it is a valid ZIP." },
      { status: 500 }
    );
  }
}

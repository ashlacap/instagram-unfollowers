export interface InstagramUser {
  username: string;
  href: string;
  timestamp: number;
}

interface StringListEntry {
  href: string;
  value: string;
  timestamp: number;
}

interface RelationshipEntry {
  title: string;
  media_list_data: unknown[];
  string_list_data: StringListEntry[];
}

function extractUsers(entries: RelationshipEntry[]): InstagramUser[] {
  const users: InstagramUser[] = [];
  for (const entry of entries) {
    const items = entry.string_list_data ?? [];
    const valueItem = items.find((item) => item.value);
    if (valueItem) {
      // Standard format: username in string_list_data[].value
      users.push({
        username: valueItem.value,
        href: valueItem.href || `https://www.instagram.com/${valueItem.value}`,
        timestamp: valueItem.timestamp,
      });
    } else if (entry.title) {
      // Newer export format: username is in the top-level title field
      const href = items[0]?.href || `https://www.instagram.com/${entry.title}`;
      users.push({
        username: entry.title,
        href,
        timestamp: items[0]?.timestamp ?? 0,
      });
    }
  }
  return users;
}

export function parseFollowers(json: unknown): InstagramUser[] {
  // followers_1.json is a top-level array
  if (Array.isArray(json)) {
    return extractUsers(json as RelationshipEntry[]);
  }
  return [];
}

export function parseFollowing(json: unknown): InstagramUser[] {
  // following.json wraps entries under "relationships_following"
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    const key = Object.keys(obj).find((k) => k.includes("following"));
    if (key && Array.isArray(obj[key])) {
      return extractUsers(obj[key] as RelationshipEntry[]);
    }
  }
  // Fallback: top-level array
  if (Array.isArray(json)) {
    return extractUsers(json as RelationshipEntry[]);
  }
  return [];
}

export interface AnalysisResult {
  notFollowingBack: InstagramUser[];
  followersCount: number;
  followingCount: number;
}

export function analyzeFollowers(
  followers: InstagramUser[],
  following: InstagramUser[]
): AnalysisResult {
  const followerSet = new Set(followers.map((u) => u.username.toLowerCase()));
  const notFollowingBack = following.filter(
    (u) => !followerSet.has(u.username.toLowerCase())
  );
  // Sort alphabetically
  notFollowingBack.sort((a, b) =>
    a.username.toLowerCase().localeCompare(b.username.toLowerCase())
  );
  return {
    notFollowingBack,
    followersCount: followers.length,
    followingCount: following.length,
  };
}

/**
 * LeetCode GraphQL client.
 *
 * The public `recentAcSubmissionList` endpoint returns recent accepted
 * submissions by username, no auth needed. For private profiles or older
 * history, pass a LEETCODE_SESSION cookie via env.
 */

const LC_ENDPOINT = "https://leetcode.com/graphql";

type RecentAc = {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string; // unix seconds
};

const RECENT_AC_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

const PROBLEM_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      difficulty
      topicTags { name slug }
    }
  }
`;

async function lcFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "summer-tracker/1.0 (+https://github.com/)",
    Referer: "https://leetcode.com",
  };
  if (process.env.LEETCODE_SESSION) {
    headers.Cookie = `LEETCODE_SESSION=${process.env.LEETCODE_SESSION}`;
  }
  const res = await fetch(LC_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);
  const json = (await res.json()) as { data: T; errors?: unknown };
  if (json.errors) throw new Error(`LeetCode GraphQL error: ${JSON.stringify(json.errors)}`);
  return json.data;
}

export async function fetchRecentAccepted(username: string, limit = 50): Promise<RecentAc[]> {
  const data = await lcFetch<{ recentAcSubmissionList: RecentAc[] | null }>(RECENT_AC_QUERY, {
    username,
    limit,
  });
  return data.recentAcSubmissionList ?? [];
}

export async function fetchProblemMeta(slug: string) {
  const data = await lcFetch<{
    question: { difficulty: "Easy" | "Medium" | "Hard"; topicTags: { name: string }[] } | null;
  }>(PROBLEM_QUERY, { titleSlug: slug });
  if (!data.question) return null;
  return {
    difficulty: data.question.difficulty,
    topics: data.question.topicTags.map((t) => t.name),
  };
}

export type SyncResult = {
  fetched: number;
  inserted: number;
  skipped: number;
  errors: string[];
};

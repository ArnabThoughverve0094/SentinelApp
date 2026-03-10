// utils/feedAlgorithm.ts  (or paste above SentinelFeed component)

/**
 * Interleaves Sentinel posts and X-Data posts into a prioritized feed.
 * Pattern: [sentinelChunk] [xChunk] [sentinelChunk] [xChunk] ...
 *
 * @param sentinelPosts  - All Sentinel posts, already sorted newest-first
 * @param xPosts         - All X-Data posts, already sorted newest-first
 * @param sentinelChunk  - How many Sentinel posts per block (default 20)
 * @param xChunk         - How many X-Data posts per block (default 10)
 */
export function buildInterleavedFeed<T extends { postType: string; ContentDate: string; createdAt?: any }>(
  sentinelPosts: T[],
  xPosts: T[],
  sentinelChunk: number = 20,
  xChunk: number = 10
): T[] {
  // Sort both arrays newest-first (safe copy, never mutate originals)
  const toMs = (date: any): number => {
    if (!date) return 0;
    if (typeof date === 'object' && date.toDate) return date.toDate().getTime();
    if (date instanceof Date) return date.getTime();
    return new Date(date).getTime();
  };

  const sentinels = [...sentinelPosts].sort(
    (a, b) => toMs(b.createdAt ?? b.ContentDate) - toMs(a.createdAt ?? a.ContentDate)
  );
  const xData = [...xPosts].sort(
    (a, b) => toMs(b.createdAt ?? b.ContentDate) - toMs(a.createdAt ?? a.ContentDate)
  );

  const result: T[] = [];
  let si = 0; // sentinel cursor
  let xi = 0; // x-data cursor

  // Keep going as long as either pool has posts remaining
  while (si < sentinels.length || xi < xData.length) {
    // Add up to `sentinelChunk` Sentinel posts
    for (let i = 0; i < sentinelChunk && si < sentinels.length; i++, si++) {
      result.push(sentinels[si]);
    }
    // Add up to `xChunk` X-Data posts
    for (let i = 0; i < xChunk && xi < xData.length; i++, xi++) {
      result.push(xData[xi]);
    }
  }

  return result;
}

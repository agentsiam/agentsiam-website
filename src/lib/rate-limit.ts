/**
 * A crude per-instance throttle, shared by the POST routes that cost something to serve.
 *
 * Honest about what it is: module scope on a serverless platform means one bucket per warm
 * instance, so an attacker spread across cold starts gets more than the limit. It stops the
 * accidental double-submit and the naive script, which is most of what actually happens.
 * Real protection is a shared store or a WAF rule, and belongs at the platform edge.
 *
 * Each caller gets its own bucket via `name`, so a guest filling in the contact form is
 * never throttled by someone else's booking attempts.
 */

const buckets = new Map<string, Map<string, number[]>>();

export function rateLimit(
  name: string,
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
): boolean {
  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = new Map();
    buckets.set(name, bucket);
  }

  const now = Date.now();
  const recent = (bucket.get(key) ?? []).filter((at) => now - at < windowMs);
  recent.push(now);
  bucket.set(key, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (bucket.size > 500) {
    for (const [existing, times] of bucket) {
      if (times.every((at) => now - at >= windowMs)) bucket.delete(existing);
    }
  }

  return recent.length > max;
}

/** Best guess at the caller, behind whatever proxy is in front of us. */
export function callerIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

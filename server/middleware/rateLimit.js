const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 10, message = "Too many requests. Please try again later." } = {}) => {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const forwardedFor = req.headers["x-forwarded-for"];
    const clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : String(forwardedFor || req.ip || "unknown").split(",")[0].trim();
    const key = `${clientIp}:${req.path}`;
    const existing = buckets.get(key);

    if (!existing || now > existing.expiresAt) {
      buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
      return res.status(429).json({
        message,
        retryAfterSeconds,
      });
    }

    if (Math.random() < 0.01) {
      for (const [bucketKey, bucket] of buckets.entries()) {
        if (bucket.expiresAt <= now) {
          buckets.delete(bucketKey);
        }
      }
    }

    return next();
  };
};

module.exports = { createRateLimiter };

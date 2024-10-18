// backend/utils/rateLimiter.js

import Bottleneck from 'bottleneck';

// Create a rate limiter that allows 50 requests per minute
const limiter = new Bottleneck({
  minTime: 100, // 100ms between requests
  maxConcurrent: 5, // Process up to 5 requests concurrently
});

export const rateLimitedRequest = async (requestFunction) => {
  return limiter.schedule(() => requestFunction());
};

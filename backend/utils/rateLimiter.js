// backend/utils/rateLimiter.js

import Bottleneck from 'bottleneck';

// Create a rate limiter that allows 50 requests per minute
const limiter = new Bottleneck({
  minTime: 1200, // 60000ms / 50 = 1200ms between requests
  maxConcurrent: 1, // Process one request at a time
});

export const rateLimitedRequest = async (requestFunction) => {
  return limiter.schedule(() => requestFunction());
};

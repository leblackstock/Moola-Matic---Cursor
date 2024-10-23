// backend/utils/rateLimiter.js

import Bottleneck from 'bottleneck';

// Request-based rate limiter (existing)
const requestLimiter = new Bottleneck({
  minTime: 50, // 50ms between requests (increased from 100ms)
  maxConcurrent: 10, // Process up to 10 requests concurrently (increased from 5)
});

// Token-based rate limiter (adjusted)
const tokenLimiter = new Bottleneck({
  reservoir: 30000, // Start with 30,000 tokens
  reservoirRefreshAmount: 30000, // Refill to 30,000 tokens
  reservoirRefreshInterval: 60 * 1000, // Refill every 60 seconds
});

export const rateLimitedRequest = async requestFunction => {
  return requestLimiter.schedule(() => requestFunction());
};

export const rateLimitedTokens = async tokenCount => {
  return tokenLimiter.schedule({ weight: tokenCount }, () => {
    // This function doesn't actually do anything, it just "consumes" tokens
    return Promise.resolve();
  });
};

export const rateLimitedRequestWithTokens = async (requestFunction, estimatedTokens) => {
  // First, check if we have enough tokens
  await rateLimitedTokens(estimatedTokens);
  // Then, execute the rate-limited request
  return rateLimitedRequest(requestFunction);
};

// backend/utils/tokenCalculator.js

import { encode } from 'gpt-3-encoder';

/**
 * Calculate the number of tokens in a given text
 * @param {string} text - The text to calculate tokens for
 * @returns {number} The number of tokens in the text
 */
export function calculateTokens(text) {
  return encode(text).length;
}

/**
 * Calculate the number of tokens in an array of messages
 * @param {Array} messages - An array of message objects
 * @returns {number} The total number of tokens in all messages
 */
export function calculateMessageTokens(messages) {
  return messages.reduce((total, message) => {
    return total + calculateTokens(message.content);
  }, 0);
}

/**
 * Calculate the number of tokens in base64 encoded images
 * @param {Array} images - An array of base64 encoded image strings
 * @returns {number} The total number of tokens for all images
 */
export function calculateImageTokens(images) {
  // Approximation: 1 token ≈ 4 characters in base64
  return images.reduce((total, image) => {
    return total + Math.ceil(image.length / 4);
  }, 0);
}

// backend/utils/imageProcessor.js

import axios from 'axios';
import {
  validateBase64,
  validateImageDimensions,
  validateImageSize,
} from './imageValidator.js';

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const processImages = async (imageUrls) => {
  const processedImages = await Promise.all(
    imageUrls.map(async (url) => {
      try {
        const base64Image = await convertUrlToBase64(url);
        if (validateBase64(base64Image)) {
          return base64Image;
        }
      } catch (error) {
        console.error(`Error processing image ${url}:`, error);
      }
      return null;
    })
  );

  const convertUrlToBase64 = async (url) => {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    await validateImageDimensions(buffer, MAX_WIDTH, MAX_HEIGHT);
    validateImageSize(buffer, MAX_SIZE_BYTES);

    const base64 = buffer.toString('base64');
    const mimeType = response.headers['content-type'];
    return `data:${mimeType};base64,${base64}`;
  };

  return processedImages.filter((img) => img !== null);
};

export { processImages };

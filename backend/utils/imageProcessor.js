// backend/utils/imageProcessor.js

import axios from 'axios';
import { validateBase64, validateAndResizeImage } from './imageValidator.js';

const convertUrlToBase64 = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'binary');

  const resizedBuffer = await validateAndResizeImage(buffer);
  const base64 = resizedBuffer.toString('base64');
  const mimeType = response.headers['content-type'];
  return `data:${mimeType};base64,${base64}`;
};

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

  return processedImages.filter((img) => img !== null);
};

export { processImages };

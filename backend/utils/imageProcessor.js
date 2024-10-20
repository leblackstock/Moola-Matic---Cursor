// backend/utils/imageProcessor.js

import axios from 'axios';
import { validateBase64, validateAndResizeImage } from './imageValidator.js';

const convertUrlToBase64 = async (url) => {
  console.log('Starting convertUrlToBase64 function for URL:', url);
  try {
    console.log('Fetching image data...');
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log('Image data fetched successfully');

    const buffer = Buffer.from(response.data, 'binary');
    console.log('Buffer created from image data');

    console.log('Validating and resizing image...');
    const resizedBuffer = await validateAndResizeImage(buffer);
    console.log('Image validated and resized successfully');

    const base64 = resizedBuffer.toString('base64');
    const mimeType = response.headers['content-type'];
    console.log('MIME type:', mimeType);

    const imageSizeMB = resizedBuffer.length / (1024 * 1024);
    console.log('Image size:', imageSizeMB.toFixed(2), 'MB');

    // Remove the existing data URI if present
    const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');

    // Extract the filename from the URL
    const filename = new URL(url).pathname.split('/').pop();

    return {
      base64Image: `data:${mimeType};base64,${cleanBase64}`,
      sizeMB: imageSizeMB,
      filename: filename,
    };
  } catch (error) {
    console.error('Error in convertUrlToBase64:', error);
    throw error;
  }
};

const processImages = async (imageUrls) => {
  console.log('Starting processImages function');
  console.log('Number of image URLs received:', imageUrls.length);

  const processedImages = await Promise.all(
    imageUrls.map(async (url, index) => {
      console.log(`Processing image ${index + 1}:`, url);
      try {
        console.log(
          `Attempting to convert URL to base64 for image ${index + 1}`
        );
        const { base64Image, sizeMB, filename } = await convertUrlToBase64(url);
        console.log(`Successfully converted image ${index + 1} to base64`);
        console.log(`Image ${index + 1} size:`, sizeMB.toFixed(2), 'MB');

        console.log(`Validating base64 for image ${index + 1}`);
        if (validateBase64(base64Image)) {
          console.log(`Image ${index + 1} passed base64 validation`);
          return { base64Image, sizeMB, filename };
        } else {
          console.log(`Image ${index + 1} failed base64 validation`);
        }
      } catch (error) {
        console.error(`Error processing image ${index + 1} (${url}):`, error);
      }
      return null;
    })
  );

  const filteredImages = processedImages.filter((img) => img !== null);
  console.log(
    'Number of successfully processed images:',
    filteredImages.length
  );

  if (filteredImages.length === 0) {
    console.warn(
      'No images were successfully processed. Check the logs for details.'
    );
  }

  return filteredImages;
};

export { processImages };

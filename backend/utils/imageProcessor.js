// backend/utils/imageProcessor.js

import sharp from 'sharp';

const isValidBase64 = (str) => {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
};

export const processImages = async (base64Images) => {
  const results = [];

  for (const [index, base64Image] of base64Images.entries()) {
    try {
      console.log(
        `Processing image ${index + 1}, length: ${base64Image.length}`
      );

      // Validate base64 string
      const base64Data = base64Image.split(',')[1] || base64Image;
      if (!isValidBase64(base64Data)) {
        throw new Error('Invalid base64 data');
      }

      const buffer = Buffer.from(base64Data, 'base64');
      console.log(`Image ${index + 1} buffer size: ${buffer.length} bytes`);

      // Validate image buffer
      if (buffer.length < 100) {
        // Arbitrary small size, adjust as needed
        throw new Error('Image buffer too small, likely corrupted');
      }

      // Use sharp to validate and process the image
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height || !metadata.format) {
        throw new Error('Invalid image metadata');
      }

      results.push({
        dimensions: `${metadata.width}x${metadata.height}`,
        format: metadata.format,
        size: buffer.length,
      });

      console.log(`Successfully processed image ${index + 1}`);
    } catch (error) {
      console.error(`Error processing image ${index + 1}:`, error.message);
      results.push({
        error: `Failed to process image ${index + 1}`,
        details: error.message,
      });
    }
  }

  return results;
};

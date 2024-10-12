// backend/utils/imageProcessor.js

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'tiff'];

const validateImageFormat = (metadata) => {
  if (!SUPPORTED_FORMATS.includes(metadata.format)) {
    throw new Error(
      `Unsupported image format: ${metadata.format}. Supported formats are: ${SUPPORTED_FORMATS.join(', ')}`
    );
  }
};

const convertImageToBase64 = async (filePath) => {
  try {
    const imageBuffer = await fs.readFile(filePath);
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    validateImageFormat(metadata);

    const mimeType = `image/${metadata.format}`;
    const base64Image = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error(`Error converting image to base64: ${filePath}`, error);
    return null;
  }
};

async function processImages(imagePaths) {
  console.log('Received image paths in processImages:', imagePaths);

  if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
    throw new Error('Invalid or missing image paths');
  }

  const processedImages = await Promise.all(
    imagePaths.map(async (imagePath) => {
      try {
        const absolutePath = path.resolve(
          process.cwd(),
          imagePath.replace(/^\//, '')
        );
        console.log(`Processing image: ${absolutePath}`);
        const base64Image = await convertImageToBase64(absolutePath);
        if (!base64Image) {
          console.error(`Failed to process image: ${imagePath}`);
          return null;
        }
        return { base64: base64Image, original_path: imagePath };
      } catch (error) {
        console.error(`Error processing image ${imagePath}:`, error);
        return null;
      }
    })
  );

  const validProcessedImages = processedImages.filter((img) => img !== null);
  console.log(
    `Successfully processed ${validProcessedImages.length} out of ${imagePaths.length} images`
  );

  return validProcessedImages;
}

export { processImages, convertImageToBase64 };

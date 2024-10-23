// backend/utils/imageValidator.js

import sharp from 'sharp';
import { calculateTokens } from './tokenCalculator.js';

const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'tiff', 'bmp'];

const MAX_TOKENS = 100000;
const TARGET_TOKENS = 90000; // Aim for slightly less than the max to allow some buffer

const MAX_IMAGE_SIZES = {
  jpeg: { width: 600, height: 600 },
  png: { width: 800, height: 800 },
  gif: { width: 1000, height: 1000 },
  webp: { width: 600, height: 600 },
  bmp: { width: 400, height: 400 },
  tiff: { width: 650, height: 650 },
};

export const validateImageFormat = format => {
  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(
      `Unsupported image format: ${format}. Supported formats are: ${SUPPORTED_FORMATS.join(', ')}`
    );
  }
};

export const validateBase64 = base64String => {
  const regex = /^data:image\/[a-z]+;base64,/;
  if (!regex.test(base64String)) {
    return false;
  }

  const base64Data = base64String.split(',')[1];
  try {
    atob(base64Data);
    return true;
  } catch (e) {
    return false;
  }
};

export const validateImageSize = (imageBuffer, format) => {
  const base64Image = imageBuffer.toString('base64');
  const base64String = `data:image/${format};base64,${base64Image}`;
  const tokenCount = calculateTokens(base64String);

  if (tokenCount > MAX_TOKENS) {
    throw new Error(
      `Image token count exceeds maximum allowed: ${tokenCount} tokens (max: ${MAX_TOKENS})`
    );
  }
};

export const validateAndResizeImage = async imageBuffer => {
  try {
    console.log('Starting image validation and resizing');
    const metadata = await sharp(imageBuffer).metadata();
    console.log('Image metadata:', metadata);
    const format = metadata.format;
    const maxSize = MAX_IMAGE_SIZES[format];

    if (!maxSize) {
      throw new Error(`Unsupported image format: ${format}`);
    }

    // Resize the image without explicitly removing metadata
    let resizedImage = sharp(imageBuffer).resize(maxSize.width, maxSize.height, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Get the new metadata after resizing
    const resizedMetadata = await resizedImage.metadata();

    let outputBuffer;
    let tokenCount;
    let compressionLevel = 80; // Start with 80% quality
    let scaleFactor = 0.9; // Start with 90% of max size
    let attempts = 0;
    const maxAttempts = 5;

    console.log('Starting compression loop');
    do {
      attempts++;
      console.log(`Attempt ${attempts}, compression: ${compressionLevel}, scale: ${scaleFactor}`);

      // Use existing resizeAndCompress functions with updated scale and compression
      switch (format) {
        case 'jpeg':
        case 'jpg':
          outputBuffer = await (
            await resizeAndCompressJPEG(
              resizedImage,
              resizedMetadata,
              scaleFactor,
              compressionLevel
            )
          ).toBuffer();
          break;
        case 'png':
          outputBuffer = await (
            await resizeAndCompressPNG(resizedImage, resizedMetadata, scaleFactor, compressionLevel)
          ).toBuffer();
          break;
        case 'webp':
          outputBuffer = await (
            await resizeAndCompressWebP(
              resizedImage,
              resizedMetadata,
              scaleFactor,
              compressionLevel
            )
          ).toBuffer();
          break;
        case 'gif':
          outputBuffer = await (
            await resizeAndCompressGIF(resizedImage, resizedMetadata, scaleFactor)
          ).toBuffer();
          break;
        case 'bmp':
          outputBuffer = await (
            await resizeAndCompressBMP(resizedImage, resizedMetadata, scaleFactor)
          ).toBuffer();
          break;
        case 'tiff':
          outputBuffer = await (
            await resizeAndCompressTIFF(resizedImage, resizedMetadata, scaleFactor)
          ).toBuffer();
          break;
        default:
          throw new Error(`Unsupported image format: ${format}`);
      }

      console.log(`Buffer size: ${outputBuffer.length} bytes`);

      console.log('Converting buffer to base64');
      const base64Image = outputBuffer.toString('base64');
      const base64String = `data:image/${format};base64,${base64Image}`;

      console.log('Calculating tokens');
      tokenCount = calculateTokens(base64String);
      console.log(`Current token count: ${tokenCount}`);

      // If still too large, reduce quality and scale more aggressively
      if (tokenCount > TARGET_TOKENS && attempts < maxAttempts) {
        compressionLevel -= 25; // Reduce quality more aggressively
        scaleFactor *= 0.6; // Reduce scale more aggressively
        console.log(`Reducing quality to ${compressionLevel} and scale to ${scaleFactor}`);
      } else {
        break; // Exit loop if we've reached target tokens or max attempts
      }
    } while (attempts < maxAttempts);

    if (tokenCount > MAX_TOKENS) {
      throw new Error(
        `Unable to reduce image to acceptable token count. Current count: ${tokenCount}`
      );
    }

    console.log('Image successfully validated and resized');
    return `data:image/${format};base64,${outputBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error validating and resizing image:', error);
    throw error;
  }
};

// Update helper functions to remove removeMetadata() calls
async function resizeAndCompressJPEG(image, metadata, scale, quality) {
  console.log(`Resizing JPEG: scale=${scale}, quality=${quality}`);
  const { width, height } = metadata;
  return image
    .resize(Math.round(width * scale), Math.round(height * scale), {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, force: true });
}

async function resizeAndCompressPNG(image, metadata, scale, compressionLevel) {
  const { width, height } = metadata;
  return image
    .resize(Math.round(width * scale), Math.round(height * scale), {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({
      compressionLevel: Math.round((100 - compressionLevel) / 10),
      adaptiveFiltering: true,
      palette: true,
    });
}

async function resizeAndCompressGIF(image, metadata, scale) {
  const targetSize = Math.min(1300, Math.max(metadata.width, metadata.height) * scale);
  return image
    .resize(targetSize, targetSize, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .gif({ colors: 256 });
}

async function resizeAndCompressWebP(image, metadata, scale, quality) {
  console.log(`Resizing WebP: scale=${scale}, quality=${quality}`);
  const width = Math.round(metadata.width * scale);
  const height = Math.round(metadata.height * scale);
  return image
    .resize(Math.max(1, width), Math.max(1, height), {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality });
}

async function resizeAndCompressBMP(image, metadata, scale) {
  const targetSize = Math.min(500, Math.max(metadata.width, metadata.height) * scale);
  return image
    .resize(targetSize, targetSize, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .bmp();
}

async function resizeAndCompressTIFF(image, metadata, scale) {
  const targetSize = Math.min(1000, Math.max(metadata.width, metadata.height) * scale);
  return image
    .resize(targetSize, targetSize, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .tiff({ compression: 'lzw' });
}

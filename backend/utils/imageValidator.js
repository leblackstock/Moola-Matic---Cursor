// backend/utils/imageValidator.js

import sharp from 'sharp';

const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'tiff', 'bmp'];

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB for all formats

const MAX_IMAGE_SIZES = {
  jpeg: { width: 2000, height: 2000, maxBytes: MAX_SIZE_BYTES },
  png: { width: 1000, height: 1000, maxBytes: MAX_SIZE_BYTES },
  gif: { width: 1300, height: 1300, maxBytes: MAX_SIZE_BYTES },
  webp: { width: 2400, height: 2400, maxBytes: MAX_SIZE_BYTES },
  bmp: { width: 500, height: 500, maxBytes: MAX_SIZE_BYTES },
  tiff: { width: 850, height: 850, maxBytes: MAX_SIZE_BYTES },
};

export const validateImageFormat = (format) => {
  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(
      `Unsupported image format: ${format}. Supported formats are: ${SUPPORTED_FORMATS.join(', ')}`
    );
  }
};

export const validateBase64 = (base64String) => {
  const regex = /^data:image\/[a-z]+;base64,([A-Za-z0-9+/=]*)$/;
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
  if (imageBuffer.length > MAX_SIZE_BYTES) {
    throw new Error(
      `Image size exceeds maximum allowed: ${MAX_SIZE_BYTES} bytes`
    );
  }
};

export const validateAndResizeImage = async (imageBuffer) => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const format = metadata.format;
    const maxSize = MAX_IMAGE_SIZES[format];

    if (!maxSize) {
      throw new Error(`Unsupported image format: ${format}`);
    }

    validateImageSize(imageBuffer, format);

    let resizedImage = sharp(imageBuffer);

    if (metadata.width > maxSize.width || metadata.height > maxSize.height) {
      console.log(
        `Resizing image from ${metadata.width}x${metadata.height} to fit within ${maxSize.width}x${maxSize.height}`
      );

      const aspectRatio = metadata.width / metadata.height;
      let newWidth = maxSize.width;
      let newHeight = maxSize.height;

      if (aspectRatio > 1) {
        // Image is wider than it is tall
        newHeight = Math.round(newWidth / aspectRatio);
      } else {
        // Image is taller than it is wide
        newWidth = Math.round(newHeight * aspectRatio);
      }

      resizedImage = resizedImage.resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to buffer and return
    const outputBuffer = await resizedImage.toBuffer();
    return outputBuffer;
  } catch (error) {
    console.error('Error validating and resizing image:', error);
    throw error;
  }
};

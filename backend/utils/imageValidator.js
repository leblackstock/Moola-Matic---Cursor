// backend/utils/imageValidator.js

import sharp from 'sharp';

const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'tiff'];

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

export const validateImageDimensions = async (
  imageBuffer,
  maxWidth,
  maxHeight
) => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      throw new Error(
        `Image dimensions exceed maximum allowed: ${maxWidth}x${maxHeight}`
      );
    }
  } catch (error) {
    console.error('Error validating image dimensions:', error);
    throw error;
  }
};

export const validateImageSize = (imageBuffer, maxSizeInBytes) => {
  if (imageBuffer.length > maxSizeInBytes) {
    throw new Error(
      `Image size exceeds maximum allowed: ${maxSizeInBytes} bytes`
    );
  }
};

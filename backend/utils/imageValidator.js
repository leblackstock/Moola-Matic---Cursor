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

export const validateImageFormat = format => {
  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(
      `Unsupported image format: ${format}. Supported formats are: ${SUPPORTED_FORMATS.join(', ')}`
    );
  }
};

export const validateBase64 = base64String => {
  console.log('Validating base64 string:', base64String.substring(0, 50) + '...');

  // Less strict regex that allows for different image formats
  const regex = /^data:image\/[a-z]+;base64,/;
  if (!regex.test(base64String)) {
    console.log('Base64 string failed regex test');
    console.log('Regex pattern:', regex);
    console.log('First 100 characters of base64 string:', base64String.substring(0, 100));
    return false;
  }

  const base64Data = base64String.split(',')[1];
  try {
    atob(base64Data);
    console.log('Base64 string passed validation');
    return true;
  } catch (e) {
    console.log('Error decoding base64 string:', e.message);
    console.log('First 100 characters of base64 data:', base64Data.substring(0, 100));
    return false;
  }
};

export const validateImageSize = (imageBuffer, format) => {
  if (imageBuffer.length > MAX_SIZE_BYTES) {
    throw new Error(`Image size exceeds maximum allowed: ${MAX_SIZE_BYTES} bytes`);
  }
};

export const validateAndResizeImage = async imageBuffer => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const format = metadata.format;
    const maxSize = MAX_IMAGE_SIZES[format];

    if (!maxSize) {
      throw new Error(`Unsupported image format: ${format}`);
    }

    let resizedImage = sharp(imageBuffer);

    // Resize and compress based on image format
    switch (format) {
      case 'jpeg':
      case 'jpg':
        resizedImage = await resizeAndCompressJPEG(resizedImage, metadata);
        break;
      case 'png':
        resizedImage = await resizeAndCompressPNG(resizedImage, metadata);
        break;
      case 'gif':
        resizedImage = await resizeAndCompressGIF(resizedImage, metadata);
        break;
      case 'webp':
        resizedImage = await resizeAndCompressWebP(resizedImage, metadata);
        break;
      case 'bmp':
        resizedImage = await resizeAndCompressBMP(resizedImage, metadata);
        break;
      case 'tiff':
        resizedImage = await resizeAndCompressTIFF(resizedImage, metadata);
        break;
      default:
        throw new Error(`Unsupported image format: ${format}`);
    }

    // Convert to buffer
    let outputBuffer = await resizedImage.toBuffer();

    // Ensure final size is under 3,145,728 bytes (about 3MB) before base64 encoding
    if (outputBuffer.length > 3145728) {
      throw new Error('Image size exceeds 3,145,728 bytes after optimization');
    }

    // Convert to base64
    const base64Image = outputBuffer.toString('base64');

    // Check if base64 encoded size is under 4MB
    if (base64Image.length > 4194304) {
      throw new Error('Base64 encoded image size exceeds 4MB');
    }

    return `data:image/${format};base64,${base64Image}`;
  } catch (error) {
    console.error('Error validating and resizing image:', error);
    throw error;
  }
};

// Helper functions for each image format
async function resizeAndCompressJPEG(image, metadata) {
  if (metadata.width > 2000 || metadata.height > 2000) {
    image = image.resize(1200, 1200, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  return image.jpeg({ quality: 80 });
}

async function resizeAndCompressPNG(image, metadata) {
  if (metadata.width > 1500 || metadata.height > 1500) {
    image = image.resize(1000, 1000, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  return image.png({
    compressionLevel: 9,
    adaptiveFiltering: true,
    palette: true,
  });
}

async function resizeAndCompressGIF(image, metadata) {
  if (metadata.width > 1300 || metadata.height > 1300) {
    image = image.resize(1300, 1300, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  return image.gif({ colors: 256 });
}

async function resizeAndCompressWebP(image, metadata) {
  if (metadata.width > 2400 || metadata.height > 2400) {
    image = image.resize(1500, 1500, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  return image.webp({ quality: 80 });
}

async function resizeAndCompressBMP(image, metadata) {
  if (metadata.width > 600 || metadata.height > 600) {
    image = image.resize(500, 500, { fit: 'inside', withoutEnlargement: true });
  }
  return image.bmp();
}

async function resizeAndCompressTIFF(image, metadata) {
  if (metadata.width > 1000 || metadata.height > 1000) {
    image = image.resize(1000, 1000, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  return image.tiff({ compression: 'lzw' });
}

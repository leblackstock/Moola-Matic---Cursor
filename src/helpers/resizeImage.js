// frontend/src/helpers/resizeImage.js

import { toast } from 'react-toastify';

export const IMAGE_CONSTANTS = {
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
  QUALITY: 0.8,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
};

export const resizeImage = async file => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Only images are supported.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        try {
          const aspectRatio = img.width / img.height;
          let { width, height } = calculateDimensionsWithAspectRatio(
            img.width,
            img.height,
            aspectRatio
          );

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error('Canvas to Blob conversion failed'));
                return;
              }

              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              const compressionRatio = (((file.size - resizedFile.size) / file.size) * 100).toFixed(
                1
              );

              console.log(`Image resized: ${width}x${height}, compressed by ${compressionRatio}%`);

              resolve(resizedFile);
            },
            'image/jpeg',
            IMAGE_CONSTANTS.QUALITY
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = error => reject(error);
    };

    reader.onerror = error => reject(error);
  });
};

const calculateDimensionsWithAspectRatio = (originalWidth, originalHeight, aspectRatio) => {
  let width = originalWidth;
  let height = originalHeight;

  if (width > IMAGE_CONSTANTS.MAX_WIDTH) {
    width = IMAGE_CONSTANTS.MAX_WIDTH;
    height = Math.round(width / aspectRatio);
  }

  if (height > IMAGE_CONSTANTS.MAX_HEIGHT) {
    height = IMAGE_CONSTANTS.MAX_HEIGHT;
    width = Math.round(height * aspectRatio);
  }

  if (width > IMAGE_CONSTANTS.MAX_WIDTH) {
    width = IMAGE_CONSTANTS.MAX_WIDTH;
    height = Math.round(width / aspectRatio);
  }

  return { width, height };
};

export const processImageFile = async file => {
  try {
    if (file.size > IMAGE_CONSTANTS.MAX_FILE_SIZE) {
      let resizedFile = await resizeImage(file);
      let attempts = 1;

      while (resizedFile.size > IMAGE_CONSTANTS.MAX_FILE_SIZE && attempts < 3) {
        IMAGE_CONSTANTS.QUALITY -= 0.1;
        resizedFile = await resizeImage(file);
        attempts++;
      }

      if (resizedFile.size > IMAGE_CONSTANTS.MAX_FILE_SIZE) {
        throw new Error(
          `Unable to compress ${file.name} below 5MB while maintaining acceptable quality`
        );
      }

      IMAGE_CONSTANTS.QUALITY = 0.8;
      return resizedFile;
    }
    return file;
  } catch (error) {
    toast.error(error.message);
    throw error;
  }
};

export const processMultipleImages = async files => {
  const processedFiles = [];
  const errors = [];

  for (let file of Array.from(files)) {
    try {
      const processedFile = await processImageFile(file);
      processedFiles.push(processedFile);
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      errors.push({ file: file.name, error: error.message });
    }
  }

  if (errors.length > 0) {
    toast.error(`Failed to process ${errors.length} image(s). Check console for details.`);
  }

  return processedFiles;
};

// frontend/src/components/compUpload.js

import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { processMultipleImages } from '../helpers/resizeImage.js';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
console.log('API_BASE_URL:', API_BASE_URL);

/**
 * Attempts to upload files to the server
 */
const attemptUpload = async formData => {
  try {
    return await axios.post(`${API_BASE_URL}/api/items/draft-images/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      },
      timeout: 60000, // 60 seconds timeout for multiple files
    });
  } catch (error) {
    console.error(`Error uploading files:`, error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};

/**
 * Handles file upload with retry and optimization
 */
export const handleFileChange = async (
  event,
  itemId,
  setItem,
  setHasUnsavedChanges,
  setImageUploaded
) => {
  const files = Array.from(event.target.files);
  const formData = new FormData();
  formData.append('itemId', itemId);
  files.forEach(file => formData.append('images', file));

  try {
    // Try original upload first
    const response = await attemptUpload(formData);

    if (Array.isArray(response.data)) {
      setHasUnsavedChanges(true);
      setImageUploaded(true);
      toast.success('Images uploaded successfully');
      return response.data;
    }
  } catch (error) {
    console.error('Error uploading images:', error);

    // If error is related to file size, try resizing
    if (error.response?.status === 413 || error.message?.includes('size')) {
      try {
        toast.info('Optimizing images for upload...');
        const processedFiles = await processMultipleImages(files);

        const processedFormData = new FormData();
        processedFormData.append('itemId', itemId);
        processedFiles.forEach(file => processedFormData.append('images', file));

        const retryResponse = await attemptUpload(processedFormData);

        if (Array.isArray(retryResponse.data)) {
          setHasUnsavedChanges(true);
          setImageUploaded(true);
          toast.success('Images optimized and uploaded successfully');
          return retryResponse.data;
        }
      } catch (retryError) {
        console.error('Retry upload failed:', retryError);
        toast.error('Failed to upload images even after optimization');
        throw retryError;
      }
    }
    throw error;
  }
};

/**
 * Processes frontend image deletion
 */
export const processFrontendImageDeletion = image => {
  console.log('processFrontendImageDeletion called with:', image);
  try {
    const filename = image.filename || image.url.split('/').pop() || '';
    console.log(`Attempting to delete frontend image: ${filename}`);
    return { success: true, filename };
  } catch (error) {
    console.error('Error processing frontend image deletion:', error);
    throw error;
  }
};

/**
 * Deletes an image from the server
 */
export const deleteImageFromServer = async (image, itemId) => {
  console.log('deleteImageFromServer called with:', { image, itemId });
  try {
    if (!itemId) {
      console.error('ItemId is undefined when trying to delete image');
      throw new Error('ItemId is required to delete an image');
    }
    const url = `${API_BASE_URL}/api/items/draft-images/delete/${itemId}/${image.filename}`;
    console.log('Sending DELETE request to:', url);
    const response = await axios.delete(url);
    console.log('Image deleted from server:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error deleting image from server:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    return { success: false, error };
  }
};

/**
 * Handles multiple file uploads
 */
export const handleMultipleFileUploads = async (files, itemId) => {
  console.log('handleMultipleFileUploads called with:', {
    files: files.map(f => f.name),
    itemId,
  });
  const uploadPromises = files.map(file => handleFileUpload(file, itemId));
  const results = await Promise.allSettled(uploadPromises);
  console.log('Upload results:', results);
  return results
    .filter(result => result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value);
};

/**
 * Handles image deletion with state updates
 */
export const handleImageDelete = async (image, itemId, setUploadedImages, setItem) => {
  console.log('handleImageDelete called with:', { image, itemId });
  try {
    const result = await deleteImageFromServer(image, itemId);

    if (result.success) {
      setUploadedImages(prevImages => {
        const updatedImages = prevImages.filter(img => img.filename !== image.filename);
        console.log('Updated images after deletion:', updatedImages);
        return updatedImages;
      });

      setItem(prevItem => {
        const updatedItem = {
          ...prevItem,
          images: prevItem.images.filter(img => img.filename !== image.filename),
        };
        console.log('Updated item after image deletion:', updatedItem);
        return updatedItem;
      });

      toast.success('Image deleted successfully');
    } else {
      throw new Error('Failed to delete image on the server');
    }
  } catch (error) {
    console.error('Error handling image deletion:', error);
    toast.error('Failed to delete image. Please try again.');
  }
};

// Export the handleFileUpload function for direct use if needed
export const handleFileUpload = async (files, itemId) => {
  console.log(`Starting upload for ${files.length} files, itemId: ${itemId}`);
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  formData.append('itemId', itemId);

  try {
    console.log(`Sending POST request to: ${API_BASE_URL}/api/items/draft-images/upload`);
    const response = await attemptUpload(formData);

    if (response.status === 200) {
      console.log(`Files uploaded successfully:`, response.data);
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error uploading files:`, error);
    throw error;
  }
};

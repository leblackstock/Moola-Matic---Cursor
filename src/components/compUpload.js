// frontend/src/components/compUpload.js

import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
console.log('API_BASE_URL:', API_BASE_URL);

// Updated handleFileUpload function
const handleFileUpload = async (files, itemId) => {
  console.log(`Starting upload for ${files.length} files, itemId: ${itemId}`);
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  formData.append('itemId', itemId);

  try {
    console.log(
      `Sending POST request to: ${API_BASE_URL}/api/items/draft-images/upload`
    );
    const response = await axios.post(
      `${API_BASE_URL}/api/items/draft-images/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
        timeout: 60000, // 60 seconds timeout for multiple files
      }
    );

    console.log(`Upload response:`, response);

    if (response.status === 200) {
      console.log(`Files uploaded successfully:`, response.data);
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
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

// New function to check if a file already exists
const checkFileExists = async (itemId, filename) => {
  console.log('checkFileExists called with:', { itemId, filename });
  try {
    const url = `${API_BASE_URL}/api/items/draft-images/check/${itemId}/${encodeURIComponent(filename)}`;
    console.log('Sending GET request to:', url);
    const response = await axios.get(url);
    console.log('File exists response:', response.data);
    return response.data.exists;
  } catch (error) {
    console.error('Error checking file existence:', error);
    console.error('Error response:', error.response?.data);
    return false;
  }
};

// Updated handleFileChange function
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

  files.forEach((file) => {
    formData.append('images', file);
  });

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/items/draft-images/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Upload response:', response.data);

    if (response.data && response.data.uploadedFiles) {
      setItem((prevItem) => ({
        ...prevItem,
        images: [...(prevItem.images || []), ...response.data.uploadedFiles],
      }));
      setHasUnsavedChanges(true);
      setImageUploaded(true);
      return response.data;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

// Function to process frontend image deletion
export const processFrontendImageDeletion = (image) => {
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

// Combined function to handle image deletion from UI
export const handleImageDeletion = async (item, itemId, imageUrl) => {
  if (!item || !itemId) {
    console.error('Item or itemId is missing');
    throw new Error('Item and itemId are required to delete an image');
  }

  try {
    // ... rest of the function
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Updated function to delete image from server
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

// Function to handle multiple file uploads
export const handleMultipleFileUploads = async (files, itemId) => {
  console.log('handleMultipleFileUploads called with:', {
    files: files.map((f) => f.name),
    itemId,
  });
  const uploadPromises = files.map((file) => handleFileUpload(file, itemId));
  const results = await Promise.allSettled(uploadPromises);
  console.log('Upload results:', results);
  return results
    .filter((result) => result.status === 'fulfilled' && result.value !== null)
    .map((result) => result.value);
};

export const handleImageDelete = async (
  image,
  itemId,
  setUploadedImages,
  setItem
) => {
  console.log('handleImageDelete called with:', { image, itemId });
  try {
    const result = await deleteImageFromServer(image, itemId);

    if (result.success) {
      setUploadedImages((prevImages) => {
        const updatedImages = prevImages.filter(
          (img) => img.filename !== image.filename
        );
        console.log('Updated images after deletion:', updatedImages);
        return updatedImages;
      });

      setItem((prevItem) => {
        const updatedItem = {
          ...prevItem,
          images: prevItem.images.filter(
            (img) => img.filename !== image.filename
          ),
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

// ... rest of the component ...

export const FileUpload = ({ onFileChange, itemId }) => {
  const handleChange = async (event) => {
    const files = Array.from(event.target.files);
    console.log('Files selected:', files);

    if (!itemId) {
      console.error('ItemId is missing in FileUpload component');
      return;
    }

    try {
      console.log('Starting file upload process');
      const uploadPromises = files.map((file) =>
        handleFileUpload(file, itemId)
      );
      await Promise.all(uploadPromises);
      onFileChange(files);
    } catch (error) {
      console.error('Error handling file change:', error);
    }
  };

  // ... rest of the component ...
};

// frontend/src/components/compUpload.js

import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; // Assuming you're using react-toastify for notifications
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
console.log('API_BASE_URL:', API_BASE_URL);

// Function to handle file upload
const handleFileUpload = async (file, itemId) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('itemId', itemId);

  try {
    const response = await axios.post(
      '/api/items/draft-images/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // Set a 30-second timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      }
    );

    if (response.status === 200) {
      console.log('File uploaded successfully:', response.data);
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
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

// Function to handle file change (multiple file upload)
export const handleFileChange = (setUploadedImages, itemId) => async (e) => {
  console.log('handleFileChange called with itemId:', itemId);
  const files = Array.from(e.target.files || []);
  console.log(
    'Files selected:',
    files.map((f) => f.name)
  );

  if (!files.length) {
    console.log('No files selected');
    toast.info('No files selected');
    return;
  }

  try {
    console.log('Starting file upload process');
    const uploadResults = await uploadQueue(files, itemId);
    console.log('File upload process completed', uploadResults);
    // Handle successful uploads (e.g., update UI, state, etc.)
    setUploadedImages((prevImages) => {
      const newImages = uploadResults.map((img) => ({
        id: img.id || uuidv4(),
        url: img.url,
        filename: img.filename,
        isNew: true,
      }));
      console.log('New images to add:', newImages);
      return [...prevImages, ...newImages];
    });

    toast.success(`${files.length} image(s) uploaded successfully`);
  } catch (error) {
    console.error('Error handling file change:', error);
    toast.error('Failed to upload some images. Please try again.');
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
export const handleImageDeletion = async (
  imageToDelete,
  setItem,
  setUploadedImages,
  setHasUnsavedChanges,
  item
) => {
  console.log('handleImageDeletion called with:', { imageToDelete, item });
  try {
    if (!item || !item.itemId) {
      console.error('Item or itemId is missing');
      throw new Error('Item and itemId are required to delete an image');
    }

    await deleteImageFromServer(imageToDelete, item.itemId);

    setItem((prevItem) => {
      const updatedImages = prevItem.images.filter(
        (img) => img.id !== imageToDelete.id
      );
      console.log('Updated images after deletion:', updatedImages);
      setUploadedImages(updatedImages);
      setHasUnsavedChanges(true);
      return {
        ...prevItem,
        images: updatedImages,
      };
    });

    console.log('Image deleted successfully from UI and server');
  } catch (error) {
    console.error('Error handling image deletion:', error);
    toast.error('Failed to delete image. Please try again.');
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
    return response.data;
  } catch (error) {
    console.error('Error deleting image from server:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    throw error;
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

export const handleImageDelete = async (image, itemId, setUploadedImages) => {
  console.log('handleImageDelete called with:', { image, itemId });
  try {
    await deleteImageFromServer(image, itemId);
    setUploadedImages((prevImages) => {
      const updatedImages = prevImages.filter(
        (img) => img.filename !== image.filename
      );
      console.log('Updated images after deletion:', updatedImages);
      return updatedImages;
    });
    toast.success('Image deleted successfully');
  } catch (error) {
    console.error('Error handling image deletion:', error);
    toast.error('Failed to delete image. Please try again.');
  }
};

// ... rest of the component ...

const uploadQueue = async (files, itemId) => {
  const results = [];
  for (const file of files) {
    try {
      const result = await handleFileUpload(file, itemId);
      results.push(result);
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
    }
  }
  return results;
};

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
      await uploadQueue(files, itemId);
      onFileChange(files);
    } catch (error) {
      console.error('Error handling file change:', error);
    }
  };

  // ... rest of the component ...
};

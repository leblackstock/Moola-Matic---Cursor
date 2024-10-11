// frontend/src/components/compUpload.js

import axios from 'axios';
import {
  generateDraftFilename,
  getNextSequentialNumber,
  getImageUrl,
  getGeneratedItemId,
} from '../helpers/itemGen.js';

// Function to handle file upload
export const handleFileUpload = async (file, itemId) => {
  try {
    // Get the next sequential number from the server
    const response = await axios.get(
      `/api/items/draft-images/next-sequence/${itemId}`
    );
    const nextSequentialNumber = response.data.nextSequentialNumber;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('itemId', itemId);
    formData.append('sequentialNumber', nextSequentialNumber);

    const uploadResponse = await axios.post(
      '/api/items/draft-images/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    return uploadResponse.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

// Function to handle file change (multiple file upload)
export const handleFileChange = (setUploadedImages, itemId) => async (e) => {
  const files = Array.from(e.target.files);
  console.log('Files selected:', files);

  if (!files.length) {
    console.log('No files selected');
    return;
  }

  try {
    console.log('Starting file upload process');
    const uploadedImages = await handleMultipleFileUploads(files, itemId);
    console.log('Uploaded images:', uploadedImages);

    setUploadedImages((prevImages) => {
      console.log('Previous images:', prevImages);
      const updatedImages = Array.isArray(prevImages)
        ? [...prevImages, ...uploadedImages]
        : uploadedImages;
      console.log('Updated images:', updatedImages);
      return updatedImages;
    });
  } catch (error) {
    console.error('Error handling file change:', error);
  }
};
// Function to process frontend image deletion
export const processFrontendImageDeletion = (image) => {
  try {
    // Extract the filename from the image object
    const filename = image.filename || image.url.split('/').pop();

    console.log(`Attempting to delete frontend image: ${filename}`);

    // Here, we're not making an API call. Instead, we'll return the filename
    // so it can be used to update the UI
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
  item // Renamed from draftData to item
) => {
  console.log('Image to delete:', imageToDelete);
  try {
    if (!item || !item.itemId) {
      console.error('Item or itemId is missing');
      throw new Error('Item and itemId are required to delete an image');
    }

    // Delete the image from the server
    await deleteImageFromServer(imageToDelete, item.itemId);

    // Update the UI
    setItem((prevItem) => {
      const updatedImages = prevItem.images.filter(
        (img) => img.id !== imageToDelete.id
      );
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
    // You might want to show an error message to the user here
  }
};

// Updated function to delete image from server
export const deleteImageFromServer = async (image, itemId) => {
  try {
    console.log('Deleting image from server:', { image, itemId });
    if (!itemId) {
      console.error('ItemId is undefined when trying to delete image');
      throw new Error('ItemId is required to delete an image');
    }
    const response = await axios.delete(
      `/api/items/draft-images/delete/${itemId}/${image.filename}`
    );
    console.log('Image deleted from server:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting image from server:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
      console.error('Server error details:', error.response.data.details);
      console.error('Server error stack:', error.response.data.stack);
    }
    throw error;
  }
};

// Function to handle multiple file uploads
export const handleMultipleFileUploads = async (files, itemId) => {
  const uploadPromises = files.map((file) => handleFileUpload(file, itemId));
  const results = await Promise.all(uploadPromises);
  return results.filter((result) => result !== null);
};

// frontend/src/components/compUpload.js

import axios from 'axios';
import { generateDraftFilename } from './compSave.js';

// Function to handle file upload
export const handleFileUpload = async (
  file,
  backendPort,
  item,
  sequentialNumber
) => {
  console.log('Uploading file:', file.name, 'for item:', item.itemId);
  const formData = new FormData();
  formData.append('image', file);
  formData.append('itemId', item.itemId);

  const uniqueFilename = generateDraftFilename(
    item.itemId,
    sequentialNumber,
    file.name
  );
  console.log('Generated unique filename:', uniqueFilename);
  formData.append('filename', uniqueFilename);

  try {
    console.log(
      'Sending request to:',
      `http://localhost:${backendPort}/api/draft-image/upload`
    );
    const response = await axios.post(
      `http://localhost:${backendPort}/api/draft-image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Server response:', response.data);

    const newImage = {
      id: `image-${Date.now()}`,
      url: `http://localhost:${backendPort}${response.data.url}`,
      filename: uniqueFilename, // Use the generated filename here
      isNew: true,
    };

    console.log('New image created:', newImage);
    return { newImage, response: response.data };
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error.response) {
      console.error('Server error response:', error.response.data);
    }
    throw error;
  }
};

// Function to handle file change (multiple file upload)
export const handleFileChange = async (
  event,
  item,
  backendPort,
  setItem,
  setUploadedImages,
  setHasUnsavedChanges,
  setImageUploaded
) => {
  const files = event.target.files;
  if (files && files.length > 0) {
    if (!item.itemId) {
      console.error('Item ID is missing');
      return;
    }

    try {
      const newImages = [];
      const existingFilenames = new Set(
        item.images?.map((img) => img.filename) || []
      );

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sequentialNumber = (item.images?.length || 0) + i + 1;

        const { newImage } = await handleFileUpload(
          file,
          backendPort,
          item,
          sequentialNumber
        );

        if (newImage && !existingFilenames.has(newImage.filename)) {
          newImages.push(newImage);
          existingFilenames.add(newImage.filename);
        }
      }

      if (newImages.length > 0) {
        setItem((prevItem) => ({
          ...prevItem,
          images: [...(prevItem.images || []), ...newImages],
        }));

        setUploadedImages((prevImages) => [...prevImages, ...newImages]);
        setHasUnsavedChanges(true);
        setImageUploaded(true);
      }
    } catch (error) {
      console.error('Error processing images:', error);
    }
  }
};

// Function to handle image deletion
export const handleDeleteImage = (
  imageToDelete,
  setItem,
  setUploadedImages,
  setHasUnsavedChanges
) => {
  setItem((prevItem) => ({
    ...prevItem,
    images: prevItem.images.filter((img) => img.id !== imageToDelete.id),
  }));

  setUploadedImages((prevImages) =>
    prevImages.filter((img) => img.id !== imageToDelete.id)
  );

  setHasUnsavedChanges(true);
};

// Function to delete image from frontend
export const deleteImageFromFrontend = async (image) => {
  // Extract the filename from the image object
  const filename = image.filename || image.url.split('/').pop();

  console.log(`Attempting to delete frontend image: ${filename}`);

  try {
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
  backendPort,
  item // Renamed from draftData to item
) => {
  console.log('Image to delete:', imageToDelete);
  try {
    if (!item || !item.itemId) {
      console.error('Item or itemId is missing');
      throw new Error('Item and itemId are required to delete an image');
    }

    // Delete the image from the server
    await deleteImageFromServer(imageToDelete, backendPort, item.itemId);

    // Update the UI
    const updatedImages = item.images.filter(
      (img) => img.id !== imageToDelete.id
    );
    setItem((prevItem) => ({
      ...prevItem,
      images: updatedImages,
    }));
    setUploadedImages(updatedImages);
    setHasUnsavedChanges(true);

    console.log('Image deleted successfully from UI and server');
  } catch (error) {
    console.error('Error handling image deletion:', error);
    // You might want to show an error message to the user here
  }
};

// Updated function to delete image from server
export const deleteImageFromServer = async (image, backendPort, itemId) => {
  try {
    console.log('Deleting image from server:', { image, backendPort, itemId });
    if (!itemId) {
      console.error('ItemId is undefined when trying to delete image');
      throw new Error('ItemId is required to delete an image');
    }
    const response = await axios.delete(
      `http://localhost:${backendPort}/api/draft-image/${itemId}/${image.filename}`
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

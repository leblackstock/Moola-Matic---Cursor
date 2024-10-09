// frontend\src\components\compSave.js

import axios from 'axios';

// Define API_URL
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || 3001;
const API_URL = `http://localhost:${BACKEND_PORT}/api`;

// Function to create a default item
export const createDefaultItem = (itemId) => {
  return {
    itemId: itemId,
    name: '',
    brand: '',
    condition: '',
    description: '',
    uniqueFeatures: '',
    accessories: '',
    purchasePrice: '',
    salesTax: '',
    cleaningNeeded: false,
    cleaningTime: '',
    cleaningMaterialsCost: '',
    estimatedValue: '',
    shippingCost: '',
    platformFees: '',
    images: [],
  };
};

// Function to handle new item creation
export const handleNewItem = (
  itemId,
  setCurrentItemId,
  setMostRecentItemId,
  navigate
) => {
  console.log('handleNewItem: New item created with ID:', itemId);

  const newItem = createDefaultItem(itemId);

  // Clear any existing local storage for this new item
  localStorage.removeItem(`item_${itemId}`);
  localStorage.removeItem(`contextData_${itemId}`);
  localStorage.removeItem(`messages_${itemId}`);

  // Save the new empty item to local storage
  handleLocalSave(newItem, {}, []);

  setCurrentItemId(itemId);
  setMostRecentItemId(itemId);

  navigate(`/new-item/${itemId}`);
  return itemId;
};

// Function to handle draft save
export const handleDraftSave = async (
  item,
  messages,
  currentItemId,
  backendPort
) => {
  console.log('handleDraftSave: Saving draft for item with ID:', currentItemId);
  if (!currentItemId) {
    console.error('Cannot save draft without a valid item ID');
    return;
  }

  try {
    const itemCopy = { ...item };

    console.log('Images to be saved:', itemCopy.images);

    // Separate existing images (URLs) and new images (File objects)
    const existingImages = itemCopy.images
      .filter((image) => image.url && !image.file)
      .map((image) => ({ ...image, isNew: false }));

    const newImages = itemCopy.images
      .filter((image) => image.file)
      .map((image) => ({ ...image, isNew: true }));

    console.log('Existing Images:', existingImages);
    console.log('New Images:', newImages);

    // Combine existing and new images
    const allImages = [...existingImages, ...newImages];

    // Prepare the data to send
    const dataToSend = {
      ...itemCopy,
      messages,
      itemId: currentItemId,
      images: allImages,
    };

    console.log('Data prepared, sending to server:', dataToSend);

    const response = await axios.post(
      `http://localhost:${backendPort}/api/save-draft`,
      dataToSend,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status !== 200) {
      throw new Error('Failed to save draft');
    }

    const savedDraft = response.data.item;
    console.log('Draft saved successfully. Server response:', savedDraft);
    return savedDraft;
  } catch (error) {
    console.error('handleDraftSave: Error saving draft:', error);
    throw error;
  }
};

// Function to handle autosave
export const handleAutoSave = async (
  item,
  uploadedImages,
  backendPort,
  setItem,
  setUploadedImages,
  setHasUnsavedChanges,
  setLastAutoSave,
  onSuccess,
  onError
) => {
  console.log('Starting auto-save process');
  try {
    // Prepare the data to be sent
    const formData = new FormData();
    const draftData = {
      ...item,
      images: uploadedImages.map(img => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        isNew: img.isNew
      }))
    };
    formData.append('draftData', JSON.stringify(draftData));

    // Append new images if they exist
    uploadedImages.forEach((img) => {
      if (img.file && img.isNew) {
        formData.append('images', img.file, img.filename);
      }
    });

    console.log('Data being sent for auto-save:', draftData);

    const response = await axios.post(
      `http://localhost:${backendPort}/api/save-draft`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Auto-save response:', response.data);

    if (response.data && response.data.item) {
      // Merge the saved images with the existing uploaded images
      const mergedImages = response.data.item.images.map(savedImg => {
        const existingImg = uploadedImages.find(img => img.id === savedImg.id);
        return existingImg || savedImg;
      });

      setItem({
        ...response.data.item,
        images: mergedImages
      });
      setUploadedImages(mergedImages);
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      onSuccess(response.data);
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error during auto-save:', error);
    if (error.response) {
      console.error('Server responded with:', error.response.data);
      console.error('Status code:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    onError(error);
  }
};

// Function to handle local save
export const handleLocalSave = (item, contextData, messages) => {
  console.log('handleLocalSave called with:', { item, contextData, messages });
  if (!item) {
    console.error('handleLocalSave: Item is undefined');
    return;
  }

  const itemId = item.itemId || item._id;
  if (!itemId) {
    console.error('handleLocalSave: ItemId is undefined');
    return;
  }

  console.log('handleLocalSave: Saving locally for item with ID:', itemId);

  try {
    // Use a Set to keep track of unique filenames
    const uniqueFilenames = new Set();
    const uniqueImages = [];

    // Add images to the uniqueImages array only if their filename is not already in the Set
    item.images.forEach(img => {
      if (!uniqueFilenames.has(img.filename)) {
        uniqueFilenames.add(img.filename);
        uniqueImages.push(img);
      }
    });

    // Create the item to be saved with unique images
    const itemToSave = {
      ...item,
      images: uniqueImages
    };

    console.log('Item to be saved:', itemToSave);

    // Save the item to local storage
    localStorage.setItem(`item_${itemId}`, JSON.stringify(itemToSave));
    localStorage.setItem(`contextData_${itemId}`, JSON.stringify(contextData || {}));
    localStorage.setItem(`messages_${itemId}`, JSON.stringify(messages || []));

    console.log('Local save successful');
  } catch (error) {
    console.error('Error during local save:', error);
  }
};

// Function to load local data based on itemId
export const loadLocalData = (itemId) => {
  const itemString = localStorage.getItem(`item_${itemId}`);
  const contextDataString = localStorage.getItem(`contextData_${itemId}`);
  const messagesString = localStorage.getItem(`messages_${itemId}`);

  return {
    item: itemString ? JSON.parse(itemString) : null,
    contextData: contextDataString ? JSON.parse(contextDataString) : {},
    messages: messagesString ? JSON.parse(messagesString) : [],
  };
};

// Function to clear local data
export const clearLocalData = () => {
  localStorage.removeItem('currentItem');
  localStorage.removeItem('messages');
};

// Function to update context data
export const updateContextData = (itemId, newData) => {
  try {
    const prevData =
      JSON.parse(localStorage.getItem(`contextData_${itemId}`)) || {};
    const updatedData = {
      ...prevData,
      ...newData,
      itemId: itemId,
    };
    localStorage.setItem(`contextData_${itemId}`, JSON.stringify(updatedData));
    return updatedData;
  } catch (error) {
    console.error('Error updating context data:', error);
    throw error;
  }
};

// Function to save a draft (for ViewItemsPage)
export const saveDraft = async (item) => {
  const response = await fetch('/api/save-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error('Failed to save draft.');
  return await response.json();
};

// Function to delete a draft
export const deleteDraft = async (id) => {
  try {
    console.log('Deleting draft with id:', id);
    const response = await axios.delete(`${API_URL}/drafts/${id}`);
    console.log('Delete response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
};

// Function to fetch drafts
export const fetchDrafts = async () => {
  try {
    const response = await fetch(
      `http://localhost:${process.env.REACT_APP_BACKEND_PORT}/api/drafts`
    );
    const data = await response.json();
    console.log('Drafts fetched from API:', data);
    return data;
  } catch (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
};

// Function to fetch items
export const fetchItems = async () => {
  const response = await fetch('/api/items');
  if (!response.ok) throw new Error('Failed to fetch items.');
  return await response.json();
};

// Function to handle draft save with image processing
export const handleDraftSaveWithImages = async (
  item,
  messages,
  currentItemId,
  backendPort
) => {
  console.log(
    'handleDraftSaveWithImages: Starting save process for item:',
    item
  );
  if (!currentItemId) {
    console.error('Cannot save draft without a valid item ID');
    return;
  }

  try {
    const formData = new FormData();
    const itemCopy = { ...item };

    console.log('Images before processing:', itemCopy.images);

    // Process images
    if (itemCopy.images && itemCopy.images.length > 0) {
      itemCopy.images.forEach((image, index) => {
        if (image.file) {
          console.log(`Appending new image file: ${image.file.name}`);
          formData.append(`newImages`, image.file);
          formData.append(
            `newImageData`,
            JSON.stringify({
              index,
              tempPath: image.tempPath,
              filename: image.filename,
            })
          );
        } else if (image.url) {
          console.log(`Existing image URL: ${image.url}`);
          formData.append(`existingImages`, image.url);
        }
      });
    } else {
      console.log('No images to process');
    }

    // Send the original images array structure
    formData.append(
      'draftData',
      JSON.stringify({ ...itemCopy, messages, itemId: currentItemId })
    );

    console.log('FormData prepared, sending to server...');

    const response = await axios.post(
      `http://localhost:${backendPort}/api/save-draft`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.status !== 200) {
      throw new Error('Failed to save draft');
    }

    const savedDraft = response.data.item;
    console.log('Draft saved successfully. Server response:', savedDraft);
    return savedDraft;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

export const saveToLocalStorage = (draft) => {
  localStorage.setItem(
    'currentItem',
    JSON.stringify({
      ...draft,
      images: draft.images.map((img) => ({ url: img })), // Convert image strings to objects with url property
    })
  );
  if (draft.messages) {
    localStorage.setItem('messages', JSON.stringify(draft.messages));
  }
};

export const handleManualSave = async (
  item,
  uploadedImages,
  backendPort,
  setItem,
  setUploadedImages,
  setHasUnsavedChanges,
  setLastAutoSave
) => {
  console.log('Starting manual save process...');
  console.log('Current item state:', item);
  console.log('Current uploadedImages:', uploadedImages);

  const formData = new FormData();

  // Combine existing images from item and new uploaded images
  const combinedImages = [
    ...(item.images || []),
    ...uploadedImages.filter(img => !item.images.some(existingImg => existingImg.id === img.id))
  ];

  const updatedItem = {
    ...item,
    images: combinedImages,
  };

  formData.append('draftData', JSON.stringify(updatedItem));

  // Append new images if they exist
  uploadedImages.forEach((img) => {
    if (img.file && img.isNew) {
      formData.append('images', img.file, img.filename);
    }
  });

  console.log('Item data being saved:', updatedItem);

  try {
    console.log('Sending save request to server...');
    const response = await axios.post(
      `http://localhost:${backendPort}/api/save-draft`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log('Server response:', response.data);

    if (response.data.item) {
      console.log('Manual save successful:', response.data.item);
      setItem(response.data.item);
      setUploadedImages(response.data.item.images || []);
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      return response.data.item;
    } else {
      console.error('Manual save failed: Unexpected response format');
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error during manual save:', error);
    throw error;
  }
};

export const updateItem = (prevItem, field, value, contextData, messages, handleLocalSave, setHasUnsavedChanges) => {
  if (!prevItem) {
    console.error('updateItem: prevItem is null');
    return null;
  }
  const updatedItem = { ...prevItem, [field]: value };
  console.log('updateItem: Updating item:', updatedItem);
  handleLocalSave(updatedItem, contextData, messages); // Save after each update
  setHasUnsavedChanges(true);
  return updatedItem;
};

// Function to handle file upload
export const handleFileUpload = async (file, backendPort, item) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('itemId', item.itemId);

  // Get the current image count
  const currentImageCount = item.images ? item.images.length : 0;

  // Generate a unique filename
  const fileExtension = file.name.split('.').pop();
  const uniqueFilename = `${item.itemId}_image_${currentImageCount + 1}.${fileExtension}`;
  formData.append('filename', uniqueFilename);

  try {
    const response = await axios.post(
      `http://localhost:${backendPort}/api/draft-image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const currentImageURL = `http://localhost:${backendPort}${response.data.imageUrl}`;

    const newImage = {
      id: Date.now().toString(),
      url: currentImageURL,
      filename: response.data.filename,
      isNew: true,
    };

    return { newImage, response };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteAllDrafts = async () => {
  try {
    console.log('Deleting all drafts');
    const response = await axios.delete(`${API_URL}/drafts`);
    console.log('Delete all drafts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting all drafts:', error);
    throw error;
  }
};
// frontend\src\components\compSave.js

import axios from 'axios';
import { useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';

// Define API_URL
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || 3001;
const API_URL = `http://localhost:${BACKEND_PORT}/api`;

// Function to create a default item
export const createDefaultItem = (itemId) => {
  if (!itemId) {
    throw new Error('ItemId is required when creating a new item');
  }
  return {
    itemId: itemId,
    name: '',
    description: '',
    category: '',
    itemDetails: {
      type: '',
      brand: '',
      condition: '',
      rarity: '',
      authenticityConfirmed: false,
      packagingAccessories: '',
    },
    images: [],
    purchaseDate: null,
    listingDate: null,
    financials: {
      purchasePrice: '',
      cleaningRepairCosts: '',
      estimatedShippingCosts: '',
      platformFees: '',
      expectedProfit: '',
      estimatedValue: '',
    },
    marketAnalysis: {
      marketDemand: '',
      historicalPriceTrends: '',
      marketSaturation: '',
      salesVelocity: '',
    },
    finalRecommendation: {
      purchaseRecommendation: false,
      detailedBreakdown: '',
    },
    sellerNotes: '',
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
    throw new Error('Invalid item ID');
  }

  try {
    const itemCopy = { ...item, itemId: currentItemId };

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
    if (!item.itemId) {
      throw new Error('Item ID is missing');
    }

    const draftData = {
      ...item,
      images: uploadedImages,
    };

    console.log('Data being sent for auto-save:', draftData);

    const response = await axios.post(
      `http://localhost:${backendPort}/api/autosave-draft`,
      { draftData },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Auto-save response:', response.data);

    if (response.data && response.data.item) {
      setItem(response.data.item);
      setUploadedImages(response.data.item.images || []);
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      onSuccess(response.data);
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error during auto-save:', error);
    onError(error);
  }
};

// Function to handle local save
export const handleLocalSave = (item, contextData, messages) => {
  if (!item || !item.itemId) {
    console.error('Cannot save item without a valid itemId');
    return;
  }

  const itemToSave = {
    ...item,
    images: item.images.map((img) => ({
      id: img.id,
      url: img.url,
      filename: img.filename,
      isNew: img.isNew,
    })),
  };

  localStorage.setItem(`item_${item.itemId}`, JSON.stringify(itemToSave));
  localStorage.setItem(
    `contextData_${item.itemId}`,
    JSON.stringify(contextData)
  );
  localStorage.setItem(`messages_${item.itemId}`, JSON.stringify(messages));

  console.log('Item saved locally:', itemToSave);
};

// Function to load local data based on itemId
export const loadLocalData = (itemId) => {
  if (!itemId) {
    console.error('Cannot load data without a valid itemId');
    return null;
  }

  const itemString = localStorage.getItem(`item_${itemId}`);
  const contextDataString = localStorage.getItem(`contextData_${itemId}`);
  const messagesString = localStorage.getItem(`messages_${itemId}`);

  if (!itemString) {
    console.log('No local data found for itemId:', itemId);
    return null;
  }

  const item = JSON.parse(itemString);
  const contextData = contextDataString ? JSON.parse(contextDataString) : {};
  const messages = messagesString ? JSON.parse(messagesString) : [];

  console.log('Loaded local data for itemId:', itemId, 'Item:', item);

  return { item, contextData, messages };
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
    ...uploadedImages.filter(
      (img) => !item.images.some((existingImg) => existingImg.id === img.id)
    ),
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

export const updateItem = (
  prevItem,
  field,
  value,
  contextData,
  messages,
  handleLocalSave,
  setHasUnsavedChanges
) => {
  if (!prevItem) {
    console.error('updateItem: prevItem is null');
    return null;
  }

  let updatedItem = { ...prevItem };

  // Handle nested fields
  if (field.includes('.')) {
    const [parentField, childField] = field.split('.');
    updatedItem[parentField] = {
      ...updatedItem[parentField],
      [childField]: value,
    };
  } else {
    updatedItem[field] = value;
  }

  console.log('updateItem: Updating item:', updatedItem);
  handleLocalSave(updatedItem, contextData, messages); // Save after each update
  setHasUnsavedChanges(true);
  return updatedItem;
};

// Function to handle file upload
export const handleFileUpload = async (
  file,
  backendPort,
  item,
  setUploadedImages,
  imageName
) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('itemId', item.itemId);
  formData.append('filename', imageName);

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
      filename: imageName,
      isNew: true,
    };

    setUploadedImages((prevImages) => [...prevImages, newImage]);

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

// New autosave hook
export const useAutosave = (
  item,
  uploadedImages,
  backendPort,
  setItem,
  setUploadedImages,
  setHasUnsavedChanges,
  setLastAutoSave
) => {
  const debouncedAutoSave = useCallback(
    debounce((currentItem, currentUploadedImages) => {
      if (currentItem && currentItem.itemId) {
        console.log('Debounced auto-save triggered');
        const dataToSave = {
          ...currentItem,
          images: currentUploadedImages,
        };

        handleAutoSave(
          dataToSave,
          currentUploadedImages,
          backendPort,
          setItem,
          setUploadedImages,
          setHasUnsavedChanges,
          setLastAutoSave,
          (savedData) => {
            console.log('Auto-save successful', savedData);
          },
          (error) => {
            console.error('Error auto-saving:', error);
          }
        );
      }
    }, 5000), // Debounce for 5 seconds
    [
      backendPort,
      setItem,
      setUploadedImages,
      setHasUnsavedChanges,
      setLastAutoSave,
    ]
  );

  useEffect(() => {
    if (item && item.itemId) {
      debouncedAutoSave(item, uploadedImages);
    }
  }, [item, uploadedImages, debouncedAutoSave]);

  return debouncedAutoSave;
};

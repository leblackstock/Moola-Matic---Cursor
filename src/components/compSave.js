// frontend\src\components\compSave.js

import axios from 'axios';
import { useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';

// Add this function near the top of the file, after the imports
export const generateDraftFilename = (
  itemId,
  sequentialNumber = 1,
  originalFilename = 'image'
) => {
  const fileExtension = originalFilename.includes('.')
    ? originalFilename.split('.').pop().toLowerCase()
    : 'jpg';
  const paddedSequentialNumber = String(sequentialNumber).padStart(2, '0');
  return `Draft-${itemId.slice(-6)}-${paddedSequentialNumber}.${fileExtension}`;
};

// Define API_URL
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || 3001;
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Function to create a default item
export const createDefaultItem = (ItemId) => {
  if (!ItemId) {
    throw new Error('ItemId is required when creating a new item');
  }
  return {
    ItemId: ItemId,
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
export const handleNewItem = (ItemId, setItemId, navigate) => {
  const newItem = createDefaultItem(ItemId);

  // Clear any existing local storage for this new item
  localStorage.removeItem(`item_${ItemId}`);
  localStorage.removeItem(`contextData_${ItemId}`);
  localStorage.removeItem(`messages_${ItemId}`);

  // Save the new empty item to local storage
  handleLocalSave(newItem, {}, []);

  setItemId(ItemId);

  navigate(`/new-item/${ItemId}`);
  return ItemId;
};

// Function to handle draft save
export const handleDraftSave = async (
  item,
  messages,
  currentItemId,
  backendPort
) => {
  if (!currentItemId) {
    console.error('Cannot save draft without a valid item ID');
    throw new Error('Invalid item ID');
  }

  try {
    const itemCopy = { ...item, itemId: currentItemId };

    const existingImages = itemCopy.images
      .filter((image) => image.url && !image.file)
      .map((image) => ({ ...image, isNew: false }));

    const newImages = itemCopy.images
      .filter((image) => image.file)
      .map((image) => ({ ...image, isNew: true }));

    const allImages = [...existingImages, ...newImages];

    const dataToSend = {
      ...itemCopy,
      messages,
      itemId: currentItemId,
      images: allImages,
    };

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

    return response.data.item;
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
  try {
    if (!item || !item.itemId) {
      throw new Error('Item or itemId is missing');
    }

    const draftData = {
      ...item,
      images: uploadedImages.map((image) => ({
        id: image.id,
        url: image.url,
        filename: image.filename,
        isNew: image.isNew,
      })),
    };

    const response = await axios.post(
      `http://localhost:${backendPort}/api/items/autosave-draft`,
      { draftData },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

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
    console.error('Error during autosave:', error);
    onError(error);
  }
};

// Function to handle local save
export const handleLocalSave = (item, contextData, messages, ItemId) => {
  console.log('handleLocalSave called with:', {
    item,
    contextData,
    messages,
    ItemId,
  });

  if (!item) {
    console.error('Cannot save item: item is null or undefined');
    return;
  }

  const effectiveItemId = ItemId || item.ItemId || item.itemId;

  if (!effectiveItemId) {
    console.error('Cannot save item: no valid ItemId found', { item, ItemId });
    return;
  }

  const itemToSave = {
    ...item,
    ItemId: effectiveItemId,
    images: item.images
      ? item.images.map((img) => ({
          id: img.id,
          url: img.url,
          filename: img.filename,
          isNew: img.isNew,
        }))
      : [],
  };

  console.log(
    `Saving item to localStorage with key: item_${effectiveItemId}`,
    itemToSave
  );
  localStorage.setItem(`item_${effectiveItemId}`, JSON.stringify(itemToSave));
  localStorage.setItem(
    `contextData_${effectiveItemId}`,
    JSON.stringify(contextData || {})
  );
  localStorage.setItem(
    `messages_${effectiveItemId}`,
    JSON.stringify(messages || [])
  );
  console.log('Item saved successfully to localStorage');
};

// Function to load local data based on itemId
export const loadLocalData = (itemId) => {
  try {
    const storageKey = `item_${itemId}`;
    const data = localStorage.getItem(storageKey);
    console.log(`Loading data from localStorage with key: ${storageKey}`, data);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return null;
  }
};

// Function to clear local data
export const clearLocalData = () => {
  localStorage.removeItem('currentItem');
  localStorage.removeItem('messages');
};

// Function to update context data
export const updateContextData = (ItemId, newData) => {
  try {
    const prevData =
      JSON.parse(localStorage.getItem(`contextData_${ItemId}`)) || {};
    const updatedData = {
      ...prevData,
      ...newData,
      ItemId: ItemId,
    };
    localStorage.setItem(`contextData_${ItemId}`, JSON.stringify(updatedData));
    return updatedData;
  } catch (error) {
    console.error('Error updating context data:', error);
    throw error;
  }
};

// Function to save a draft (for ViewItemsPage)
export const saveDraft = async (item, contextData, messages) => {
  try {
    console.log('Saving draft:', { item, uploadedImages: item.images });

    // Ensure itemId is present
    if (!item.itemId) {
      throw new Error('itemId is required to save a draft');
    }

    const response = await axios.post(`${API_URL}/api/items/save-draft`, item);

    if (!response.data || !response.data.item) {
      throw new Error('Failed to save draft to database');
    }

    const savedItem = response.data.item;

    // Save locally
    handleLocalSave(savedItem, contextData, messages, savedItem.itemId);

    console.log('Draft saved successfully:', savedItem);
    return savedItem;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

// Function to delete a draft
export const deleteDraft = async (draftId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/items/drafts/${draftId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
};

// Function to fetch drafts
export const fetchDrafts = async () => {
  try {
    console.log('Fetching drafts from:', `${API_URL}/api/items/drafts`);
    const response = await axios.get(`${API_URL}/api/items/drafts`);
    console.log('Fetched drafts:', response.data);

    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn('Unexpected response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error(
      'Error fetching drafts:',
      error.response?.data || error.message
    );
    // You might want to throw the error here instead of returning an empty array,
    // depending on how you want to handle errors in the calling component
    return [];
  }
};

// Function to fetch items
export const fetchItems = async () => {
  try {
    console.log('Fetching items from:', `${API_URL}/api/items`);
    const response = await axios.get(`${API_URL}/api/items`);
    console.log('Fetched items:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
};

// Function to handle draft save with image processing
export const handleDraftSaveWithImages = async (
  item,
  messages,
  currentItemId,
  backendPort
) => {
  if (!currentItemId) {
    console.error('Cannot save draft without a valid item ID');
    return;
  }

  try {
    const itemCopy = { ...item };

    if (itemCopy.images && itemCopy.images.length > 0) {
      itemCopy.images = itemCopy.images.map((image) => ({
        id: image.id,
        url: image.url,
        filename: image.filename,
        isNew: image.isNew,
      }));
    }

    const draftData = JSON.stringify({
      ...itemCopy,
      messages,
      itemId: currentItemId,
    });

    const response = await axios.post(
      `http://localhost:${backendPort}/api/save-draft`,
      { draftData },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status !== 200) {
      throw new Error('Failed to save draft');
    }

    return response.data.item;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

export const saveToLocalStorage = (itemId, data) => {
  try {
    if (!itemId) {
      console.error('Invalid itemId:', itemId);
      return;
    }
    const storageKey = `item_${itemId}`;
    const dataToSave = {
      ...data,
      images: data.images || [], // Ensure images array is included
    };
    console.log(
      `Saving data to localStorage with key: ${storageKey}`,
      dataToSave
    );
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
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
  const combinedImages = [
    ...item.images.filter((img) => !img.isNew),
    ...uploadedImages.map((img) => ({
      id: img.id,
      url: img.url,
      filename: img.filename,
      isNew: img.isNew,
    })),
  ];

  const updatedItem = {
    ...item,
    images: combinedImages,
  };

  try {
    let savedItem;
    if (item._id) {
      // If the item has an _id, it already exists in the database, so update it
      savedItem = await updateItem(item._id, updatedItem);
    } else {
      // If the item doesn't have an _id, it's new, so create it
      savedItem = await createItem(updatedItem);
    }

    setItem(savedItem);
    setUploadedImages(savedItem.images || []);
    setHasUnsavedChanges(false);
    setLastAutoSave(new Date());
    return savedItem;
  } catch (error) {
    console.error('Error during manual save:', error);
    throw error;
  }
};

// Update the existing updateItem function to handle both state updates and database updates
export const updateItem = async (
  id,
  itemData,
  contextData,
  messages,
  handleLocalSave,
  setHasUnsavedChanges
) => {
  try {
    // Update local state
    handleLocalSave(itemData, contextData, messages);
    setHasUnsavedChanges(true);

    // Update in database
    const response = await axios.put(`${API_URL}/api/items/${id}`, itemData);
    console.log('Item updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

// Function to handle file upload
export const handleFileUpload = async (file, itemId) => {
  try {
    console.log('Uploading file:', file.name);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('itemId', itemId);

    const response = await axios.post(`/api/draft-image/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Upload response:', response.data);

    if (response.data && response.data.url) {
      return response.data;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteAllDrafts = async () => {
  try {
    const response = await axios.delete(`${API_URL}/api/items/drafts`);
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
        const dataToSave = {
          ...currentItem,
          images:
            currentUploadedImages.length > 0
              ? currentUploadedImages
              : currentItem.images,
        };

        handleAutoSave(
          dataToSave,
          currentUploadedImages,
          backendPort,
          setItem,
          setUploadedImages,
          setHasUnsavedChanges,
          setLastAutoSave,
          () => {
            console.log('Autosave successful');
          },
          (error) => {
            console.error('Error auto-saving:', error);
          }
        );
      }
    }, 30000), // Changed to 30000 milliseconds (30 seconds)
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

export const loadItemData = loadLocalData; // Assuming these are the same function

// Add a new function to create an item in the database
export const createItem = async (itemData) => {
  try {
    const response = await axios.post(`${API_URL}/api/items`, itemData);
    console.log('Item created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

export const fetchAllItems = async () => {
  try {
    const response = await fetch('/api/items');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log('Raw data from fetchAllItems:', data);
    return data;
  } catch (error) {
    console.error('Error fetching all items:', error);
    throw error;
  }
};

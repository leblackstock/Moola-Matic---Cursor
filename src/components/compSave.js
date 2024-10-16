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
  messages,
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

    // Create a Set of image URLs to ensure uniqueness
    const uniqueImageUrls = new Set(item.images.map((img) => img.url));

    const draftData = {
      ...item,
      images: [
        ...item.images.filter((img) => uniqueImageUrls.has(img.url)),
        ...uploadedImages
          .filter((img) => !uniqueImageUrls.has(img.url))
          .map((image) => ({
            id: image.id,
            url: image.url,
            filename: image.filename,
            isNew: image.isNew,
          })),
      ],
      messages: Array.isArray(messages) ? messages : [],
    };

    console.log('Autosaving data:', JSON.stringify(draftData, null, 2));

    const port = Number(backendPort) || 3001;
    const url = `http://localhost:${port}/api/items/autosave-draft`;

    const response = await axios.post(
      url,
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
      if (typeof setLastAutoSave === 'function') {
        setLastAutoSave(new Date());
      } else {
        console.warn('setLastAutoSave is not a function');
      }
      onSuccess(response.data);
      console.log('Autosave completed successfully'); // This log is now more prominent
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error during autosave:', error);
    if (error.response) {
      console.error('Server responded with:', error.response.data);
      console.error('Status code:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    onError(error);
  }
};

// Function to handle local save
export const handleLocalSave = (item, contextData, messages, ItemId) => {
  if (!item) {
    console.error('Cannot save item: item is null or undefined');
    return;
  }

  const effectiveItemId = ItemId || item.ItemId || item.itemId;

  if (!effectiveItemId) {
    console.error('Cannot save item: no valid ItemId found', { item, ItemId });
    return;
  }

  // Validate messages
  const validMessages = Array.isArray(messages)
    ? messages.filter(
        (msg) =>
          typeof msg === 'object' &&
          msg !== null &&
          'role' in msg &&
          'content' in msg
      )
    : [];

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
    messages: validMessages,
  };

  localStorage.setItem(`item_${effectiveItemId}`, JSON.stringify(itemToSave));
  localStorage.setItem(
    `contextData_${effectiveItemId}`,
    JSON.stringify(contextData || {})
  );
};

// Function to load local data based on itemId
export const loadLocalData = (itemId) => {
  try {
    const storageKey = `item_${itemId}`;
    const data = localStorage.getItem(storageKey);
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
export const saveDraft = async (draftData, contextData, messages) => {
  try {
    if (!draftData || !draftData.itemId) {
      throw new Error('itemId is required in draftData');
    }

    // Handle the purchaseRecommendation field
    if (draftData.finalRecommendation) {
      if (
        draftData.finalRecommendation.purchaseRecommendation === 'Unknown' ||
        draftData.finalRecommendation.purchaseRecommendation === ''
      ) {
        draftData.finalRecommendation.purchaseRecommendation = null;
      } else if (
        typeof draftData.finalRecommendation.purchaseRecommendation === 'string'
      ) {
        draftData.finalRecommendation.purchaseRecommendation =
          draftData.finalRecommendation.purchaseRecommendation.toLowerCase() ===
          'true';
      }
    }

    const response = await axios.post(`${API_URL}/api/items/autosave-draft`, {
      draftData,
      contextData,
      messages,
    });

    console.log('Draft saved successfully:', response.data);
    return response.data.item;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

// Function to delete a draft
export const deleteDraft = async (draftId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/items/drafts/${draftId}?deleteImages=true`
    );
    console.log('Draft and associated images deleted successfully');
    return response.data;
  } catch (error) {
    console.error('Error deleting draft and images:', error);
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
  messages,
  backendPort,
  setItem,
  setUploadedImages,
  setHasUnsavedChanges,
  setLastAutoSave
) => {
  // Create a Set of image URLs to ensure uniqueness
  const uniqueImageUrls = new Set(item.images.map((img) => img.url));

  const combinedImages = [
    ...item.images.filter((img) => uniqueImageUrls.has(img.url)),
    ...uploadedImages
      .filter((img) => !uniqueImageUrls.has(img.url))
      .map((img) => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        isNew: img.isNew,
      })),
  ];

  // Validate and format messages
  const validMessages = Array.isArray(messages)
    ? messages.filter(
        (msg) =>
          typeof msg === 'object' &&
          msg !== null &&
          'role' in msg &&
          'content' in msg
      )
    : [];

  const draftData = {
    ...item,
    images: combinedImages,
  };

  try {
    const response = await axios.post(
      `${API_URL}/api/items/autosave-draft`,
      {
        draftData,
        contextData: item.contextData || {}, // Include contextData
        messages: validMessages, // Include validated messages
      },
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
      console.log('Manual save completed successfully');
      return response.data.item;
    } else {
      throw new Error('Invalid response format from server');
    }
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
    // Create a Set of image URLs to ensure uniqueness
    const uniqueImageUrls = new Set(itemData.images.map((img) => img.url));

    const updatedItemData = {
      ...itemData,
      images: itemData.images.filter((img) => uniqueImageUrls.has(img.url)),
    };

    // Update local state
    if (typeof handleLocalSave === 'function') {
      handleLocalSave(updatedItemData, contextData, messages);
    } else {
      console.warn('handleLocalSave is not a function, skipping local save');
    }

    if (typeof setHasUnsavedChanges === 'function') {
      setHasUnsavedChanges(true);
    }

    // Update in database
    const response = await axios.put(
      `${API_URL}/api/items/${id}`,
      updatedItemData
    );
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

export const deleteAllDrafts = async (deleteImages = true) => {
  try {
    const response = await axios.delete(`${API_URL}/api/items/drafts`, {
      params: { deleteImages },
    });
    console.log('All drafts deleted successfully');
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
  messages,
  backendPort,
  setItem,
  setUploadedImages,
  setHasUnsavedChanges,
  setLastAutoSave
) => {
  const autoSave = useCallback(
    async (currentItem, currentUploadedImages, currentMessages) => {
      if (currentItem && currentItem.itemId) {
        try {
          // Validate messages
          const validMessages = Array.isArray(currentMessages)
            ? currentMessages.filter(
                (msg) =>
                  typeof msg === 'object' &&
                  msg !== null &&
                  'role' in msg &&
                  'content' in msg
              )
            : [];

          // Prepare the item data for saving
          const itemToSave = {
            ...currentItem,
            images: currentUploadedImages,
            messages: validMessages,
          };

          // Handle the purchaseRecommendation field
          if (itemToSave.finalRecommendation) {
            if (
              itemToSave.finalRecommendation.purchaseRecommendation ===
                'Unknown' ||
              itemToSave.finalRecommendation.purchaseRecommendation === ''
            ) {
              itemToSave.finalRecommendation.purchaseRecommendation = null;
            } else if (
              typeof itemToSave.finalRecommendation.purchaseRecommendation ===
              'string'
            ) {
              itemToSave.finalRecommendation.purchaseRecommendation =
                itemToSave.finalRecommendation.purchaseRecommendation.toLowerCase() ===
                'true';
            }
          }

          // Save the item
          const savedItem = await saveDraft(itemToSave, {}, validMessages);

          // Update state
          setItem(savedItem);
          setUploadedImages(savedItem.images || []);
          setHasUnsavedChanges(false);
          setLastAutoSave(new Date());
        } catch (error) {
          console.error('Error auto-saving:', error);
          // Schedule a retry after 15 seconds
          setTimeout(() => {
            console.log('Retrying autosave...');
            autoSave(currentItem, currentUploadedImages, currentMessages);
          }, 15000);
        }
      }
    },
    [
      backendPort,
      setItem,
      setUploadedImages,
      setHasUnsavedChanges,
      setLastAutoSave,
    ]
  );

  const debouncedAutoSave = useCallback(debounce(autoSave, 15000), [autoSave]);

  useEffect(() => {
    if (item && item.itemId) {
      debouncedAutoSave(item, uploadedImages, messages);
    }

    const intervalId = setInterval(() => {
      if (item && item.itemId) {
        debouncedAutoSave(item, uploadedImages, messages);
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [item, uploadedImages, messages, debouncedAutoSave]);

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

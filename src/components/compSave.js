// frontend\src\components\compSave.js

import axios from 'axios';
import { useEffect, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { toast } from 'react-toastify';
import { getNextSequentialNumber } from '../helpers/itemGen.js';

// Define API_URL
const API_URL =
  process.env.REACT_APP_BACKEND_URL ||
  `http://localhost:${process.env.REACT_APP_BACKEND_PORT || 3001}`;

// Function to handle draft save
export const handleDraftSave = async (item, messages, currentItemId) => {
  if (!currentItemId) {
    console.error('Cannot save draft without a valid item ID');
    throw new Error('Invalid item ID');
  }

  try {
    const itemCopy = { ...item, itemId: currentItemId };

    // Ensure images is an array
    const images = Array.isArray(itemCopy.images) ? itemCopy.images : [];

    const existingImages = images
      .filter(image => image.url && !image.file)
      .map(image => ({ ...image, isNewItem: false }));

    const newImages = images
      .filter(image => image.file)
      .map(image => ({ ...image, isNewItem: true }));

    const allImages = [...existingImages, ...newImages];

    const dataToSend = {
      ...itemCopy,
      messages: Array.isArray(messages) ? messages : [],
      itemId: currentItemId,
      images: allImages,
      isDraft: true, // Ensure isDraft is set to true
    };

    const response = await axios.post(`${API_URL}/api/items/save-draft`, dataToSend, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status !== 200) {
      throw new Error('Failed to save draft');
    }

    // Save to localStorage
    saveToLocalStorage(currentItemId, response.data.item);

    console.info('Draft saved successfully', { currentItemId });
    return response.data.item;
  } catch (error) {
    console.error('Error saving draft', {
      error: error.message,
      currentItemId,
    });
    throw error;
  }
};

// Function to handle autosave
export const handleAutoSave = async (
  item,
  uploadedImages,
  messages,
  setItem,
  setUploadedImages,
  setHasUnsavedChanges,
  setLastAutoSave,
  onSuccess,
  onError
) => {
  try {
    if (!item || !item.itemId) {
      console.error('Item or itemId is missing', { item });
      throw new Error('Item or itemId is missing');
    }

    const uniqueImageUrls = new Set(item.images.map(img => img.url));

    const draftData = {
      ...item,
      images: [
        ...item.images.filter(img => uniqueImageUrls.has(img.url)),
        ...uploadedImages
          .filter(img => !uniqueImageUrls.has(img.url))
          .map(image => ({
            id: image.id,
            url: image.url,
            filename: image.filename,
            isNewItem: image.isNewItem,
          })),
      ],
    };

    const requestBody = {
      draftData,
      contextData: item.contextData || {},
      messages: messages || [],
      itemId: item.itemId,
    };

    const response = await axios.post(`${API_URL}/api/items/autosave-draft`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.item) {
      setItem(response.data.item);
      setUploadedImages(response.data.item.images || []);
      setHasUnsavedChanges(false);
      if (typeof setLastAutoSave === 'function') {
        setLastAutoSave(new Date());
      }
      onSuccess(response.data);
      console.log('Autosave completed successfully');
    } else {
      throw new Error('Invalid response format from server');
    }

    console.info('Autosave completed successfully');
  } catch (error) {
    onError(error);
  }
};

// Function to handle local save
export const handleLocalSave = (item, contextData, messages, itemId) => {
  if (!item) {
    console.error('Cannot save item: item is null or undefined');
    return;
  }

  const effectiveItemId = itemId || item.itemId || item.itemId;

  if (!effectiveItemId) {
    console.error('Cannot save item: no valid itemId found', { item, itemId });
    return;
  }

  // Validate messages
  const validMessages = Array.isArray(messages)
    ? messages.filter(
        msg => typeof msg === 'object' && msg !== null && 'role' in msg && 'content' in msg
      )
    : [];

  const itemToSave = {
    ...item,
    itemId: effectiveItemId,
    images: item.images
      ? item.images.map(img => ({
          id: img.id,
          url: img.url,
          filename: img.filename,
          isNewItem: img.isNewItem,
        }))
      : [],
    messages: validMessages,
  };

  saveToLocalStorage(effectiveItemId, itemToSave);

  if (typeof localStorage !== 'undefined' && localStorage !== null) {
    localStorage.setItem(`contextData_${effectiveItemId}`, JSON.stringify(contextData || {}));
  } else {
    console.warn('localStorage is not available for saving context data');
  }
};

// Function to load local data based on itemId
export const loadLocalData = itemId => {
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
export const updateContextData = (itemId, newData) => {
  try {
    const prevData = JSON.parse(localStorage.getItem(`contextData_${itemId}`)) || {};
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
export const saveDraft = async (draftData, contextData, messages) => {
  try {
    if (!draftData || !draftData.itemId) {
      throw new Error('itemId is required in draftData');
    }

    // Handle the purchaseRecommendation field
    if (draftData.purchaseRecommendation !== undefined) {
      if (
        draftData.purchaseRecommendation === 'Unknown' ||
        draftData.purchaseRecommendation === ''
      ) {
        draftData.purchaseRecommendation = null;
      }
    }

    const response = await axios.post(`${API_URL}/api/items/save-draft`, {
      ...draftData,
      contextData,
      messages,
    });

    console.log('Draft saved successfully');
    return response.data.item;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

// Function to delete a draft
export const deleteDraft = async draftId => {
  try {
    const response = await axios.delete(`${API_URL}/api/items/drafts/${draftId}?deleteImages=true`);
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
    console.info('Fetching drafts', { url: `${API_URL}/api/items/drafts` });
    const response = await axios.get(`${API_URL}/api/items/drafts`);
    console.info('Drafts fetched successfully', {
      count: response.data.length,
    });

    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn('Unexpected response format for drafts', {
        data: response.data,
      });
      return [];
    }
  } catch (error) {
    console.error('Error fetching drafts', { error: error.message });
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
export const handleDraftSaveWithImages = async (item, messages, currentItemId, backendPort) => {
  if (!currentItemId) {
    console.error('Cannot save draft without a valid item ID');
    return;
  }

  try {
    const itemCopy = { ...item };

    if (itemCopy.images && itemCopy.images.length > 0) {
      itemCopy.images = itemCopy.images.map(image => ({
        id: image.id,
        url: image.url,
        filename: image.filename,
        isNewItem: image.isNewItem,
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
      console.error('Invalid itemId:', { itemId });
      return;
    }
    const storageKey = `item_${itemId}`;
    const dataToSave = {
      ...data,
      images: data.images || [], // Ensure images array is included
    };
    if (typeof localStorage !== 'undefined' && localStorage !== null) {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } else {
      console.warn('localStorage is not available');
    }
  } catch (error) {
    console.error('Error saving data to localStorage');
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
  const uniqueImageUrls = new Set(item.images.map(img => img.url));

  const combinedImages = [
    ...item.images.filter(img => uniqueImageUrls.has(img.url)),
    ...uploadedImages
      .filter(img => !uniqueImageUrls.has(img.url))
      .map(img => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        isNewItem: img.isNewItem,
      })),
  ];

  const validMessages = Array.isArray(messages)
    ? messages.filter(
        msg => typeof msg === 'object' && msg !== null && 'role' in msg && 'content' in msg
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
        contextData: item.contextData || {},
        messages: validMessages,
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

// Function to handle file upload
export const handleFileUpload = async (file, itemId) => {
  try {
    if (!itemId) {
      throw new Error('itemId is required for file upload');
    }

    console.info('Uploading file', { fileName: file.name, itemId });
    const sequentialNumber = await getNextSequentialNumber(itemId);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('itemId', itemId);
    formData.append('sequentialNumber', String(sequentialNumber).padStart(2, '0'));

    const response = await axios.post(`${API_URL}/api/items/draft-images/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Upload response:', response.data);

    if (response.data && response.data.url) {
      console.info('File uploaded successfully', {
        fileName: file.name,
        itemId,
      });
      return response.data;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error uploading file', {
      error: error.message,
      fileName: file.name,
      itemId,
    });
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

export const loadItemData = loadLocalData; // Assuming these are the same function

// Add a new function to create an item in the database
export const createItem = async itemData => {
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
    const response = await axios.get(`${API_URL}/api/items`);
    console.log('Raw data from fetchAllItems:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all items:', error);
    throw error;
  }
};

// Add this new function near the top of the file, after the imports and API_URL definition
export const fetchDraftItemSchema = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/items/draft-item-schema`);
    return response.data.fields;
  } catch (error) {
    console.error('Error fetching DraftItem schema:', error);
    throw error;
  }
};

// Update the updateItem function to use the fetched schema
export const updateItem = async (
  id,
  itemData,
  contextData,
  messages,
  handleLocalSave,
  setHasUnsavedChanges
) => {
  try {
    const schemaFields = await fetchDraftItemSchema();

    const uniqueImageUrls = new Set(itemData.images.map(img => img.url));

    const updatedItemData = {
      ...itemData,
      images: itemData.images.filter(img => uniqueImageUrls.has(img.url)),
    };

    // Process data types
    const numericFields = [
      'conditionEstimatedRepairCosts',
      'conditionEstimatedCleaningCosts',
      'financialsPurchasePrice',
      'financialsTotalRepairAndCleaningCosts',
      'financialsEstimatedShippingCosts',
      'financialsPlatformFees',
      'financialsExpectedProfit',
      'financialsProfitMargin',
      'financialsEstimatedMarketValue',
      'financialsAcquisitionCost',
      'marketAnalysisSuggestedListingPrice',
      'marketAnalysisMinimumAcceptablePrice',
    ];

    numericFields.forEach(field => {
      if (updatedItemData[field] !== undefined && updatedItemData[field] !== '') {
        updatedItemData[field] = Number(updatedItemData[field]);
      }
    });

    const dateFields = ['purchaseDate', 'listingDate', 'inventoryDetailsAcquisitionDate'];
    dateFields.forEach(field => {
      if (updatedItemData[field]) {
        updatedItemData[field] = new Date(updatedItemData[field]);
      }
    });

    // Remove any fields that are not in the DraftItemSchema
    Object.keys(updatedItemData).forEach(key => {
      if (!schemaFields.includes(key)) {
        delete updatedItemData[key];
      }
    });

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
    const response = await axios.put(`${API_URL}/api/items/${id}`, updatedItemData);
    console.log('Item updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

export const useAutosave = (
  itemId,
  setItem,
  setLastSaved,
  debounceDelay = 10000,
  forceSaveInterval = 60000,
  isPaused = false
) => {
  const savedDataRef = useRef(null);
  const lastSavedRef = useRef(null);
  const timeoutRef = useRef(null);
  const isProcessingRef = useRef(false); // Add this ref

  const saveData = useCallback(async () => {
    if (!itemId || !savedDataRef.current || isProcessingRef.current) {
      return;
    }

    try {
      isProcessingRef.current = true; // Set processing flag
      const requestBody = {
        draftData: savedDataRef.current,
        contextData: savedDataRef.current.contextData,
        messages: savedDataRef.current.messages,
        itemId: itemId,
      };

      const response = await axios.post(`${API_URL}/api/items/autosave-draft`, requestBody);

      if (response.data && response.data.item) {
        setItem(response.data.item);
        setLastSaved(new Date());
        lastSavedRef.current = Date.now();
        console.log('Autosave completed successfully');
      }
    } catch (error) {
      console.error('Error during autosave:', error);
    } finally {
      isProcessingRef.current = false; // Reset processing flag
    }
  }, [itemId, setItem, setLastSaved]);

  const debouncedSave = useMemo(() => debounce(saveData, debounceDelay), [saveData, debounceDelay]);

  const updateSavedData = useCallback(
    data => {
      if (isPaused || isProcessingRef.current) {
        return;
      }

      savedDataRef.current = data;
      debouncedSave();

      // Only set force save timeout if not already processing
      if (!isProcessingRef.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (!lastSavedRef.current || Date.now() - lastSavedRef.current >= forceSaveInterval) {
            saveData();
          }
        }, forceSaveInterval);
      }
    },
    [debouncedSave, saveData, forceSaveInterval, isPaused]
  );

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedSave]);

  return updateSavedData;
};

// ... rest of the component ...

export const handleSave = async (item, messages, currentItemId) => {
  if (!currentItemId) {
    console.error('Cannot save draft without a valid item ID');
    throw new Error('Invalid item ID');
  }

  try {
    const itemCopy = { ...item, itemId: currentItemId };

    const existingImages = itemCopy.images
      .filter(image => image.url && !image.file)
      .map(image => ({ ...image, isNewItem: false }));

    const newImages = itemCopy.images
      .filter(image => image.file)
      .map(image => ({ ...image, isNewItem: true }));

    const allImages = [...existingImages, ...newImages];

    const draftData = {
      ...itemCopy,
      messages,
      itemId: currentItemId,
      images: allImages,
    };

    const response = await axios.post(`${API_URL}/api/items/save-draft`, draftData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status !== 200) {
      throw new Error('Failed to save draft');
    }

    // Save to localStorage
    saveToLocalStorage(currentItemId, response.data.item);

    console.info('Draft saved successfully', { currentItemId });
    return response.data.item;
  } catch (error) {
    console.error('Error saving draft', {
      error: error.message,
      currentItemId,
    });
    throw error;
  }
};

export const deleteImageFromServer = async (image, itemId) => {
  console.log('deleteImageFromServer called with:', { image, itemId });
  try {
    if (!itemId) {
      console.error('ItemId is undefined when trying to delete image');
      throw new Error('ItemId is required to delete an image');
    }
    const url = `${API_URL}/api/items/draft-images/delete/${itemId}/${image.filename}`;
    console.log('Sending DELETE request to:', url);
    const response = await axios.delete(url);
    console.log('Image deleted from server:', response.data);

    if (response.data.updatedDraft) {
      // Update local state with the updated draft data
      return response.data.updatedDraft;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error deleting image from server:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    throw error;
  }
};

export const handleImageDelete = async (image, itemId, setUploadedImages, setItem) => {
  console.log('handleImageDelete called with:', { image, itemId });
  try {
    const updatedDraft = await deleteImageFromServer(image, itemId);

    // Update uploadedImages state
    setUploadedImages(prevImages => {
      const updatedImages = prevImages.filter(img => img.filename !== image.filename);
      console.log('Updated images after deletion:', updatedImages);
      return updatedImages;
    });

    // Update item state
    setItem(prevItem => {
      const updatedItem = {
        ...prevItem,
        images: prevItem.images.filter(img => img.filename !== image.filename),
      };
      console.log('Updated item after image deletion:', updatedItem);

      // Save updated item to localStorage
      saveToLocalStorage(itemId, updatedItem);

      return updatedItem;
    });

    toast.success('Image deleted successfully');
    return updatedDraft;
  } catch (error) {
    console.error('Error handling image deletion:', error);
    toast.error('Failed to delete image. Please try again.');
    throw error;
  }
};

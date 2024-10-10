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
  const paddedSequentialNumber = String(sequentialNumber).padStart(1, '0');
  return `Draft-${itemId.slice(-6)}-${paddedSequentialNumber}.${fileExtension}`;
};

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
      `http://localhost:${backendPort}/api/autosave-draft`,
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
};

// Function to load local data based on itemId
export const loadLocalData = (itemId) => {
  console.log('Loading local data for itemId:', itemId);
  if (!itemId) {
    console.error('Invalid itemId:', itemId);
    return null;
  }
  const key = `item_${itemId}`;
  const storedData = localStorage.getItem(key);
  console.log('Retrieved data from local storage:', storedData);
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData);
      console.log('Parsed local data:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('Error parsing stored data:', error);
      return null;
    }
  }
  console.log('No data found in local storage for key:', key);
  return null;
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
    const response = await axios.delete(`${API_URL}/drafts/${id}`);
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

export const saveToLocalStorage = (item) => {
  console.log('Saving item to local storage:', item);
  if (!item || !item.itemId) {
    console.error('Invalid item or missing itemId:', item);
    return false;
  }
  const key = `item_${item.itemId}`;
  const dataToSave = JSON.stringify({ item });
  console.log('Data being saved:', dataToSave);
  try {
    localStorage.setItem(key, dataToSave);
    console.log('Item saved to local storage with key:', key);
    return true;
  } catch (error) {
    console.error('Error saving to local storage:', error);
    return false;
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
  const formData = new FormData();

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

  formData.append('draftData', JSON.stringify(updatedItem));

  uploadedImages.forEach((img) => {
    if (img.file && img.isNew) {
      formData.append('images', img.file, img.filename);
    }
  });

  try {
    const response = await axios.post(
      `http://localhost:${backendPort}/api/save-draft`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.item) {
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
    const response = await axios.delete(`${API_URL}/drafts`);
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
            // Keeping this error log for debugging purposes
            console.error('Error auto-saving:', error);
          }
        );
      }
    }, 5000),
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

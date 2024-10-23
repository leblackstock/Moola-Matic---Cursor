// frontend\src\components\compSave.js

import axios from 'axios';
import { useEffect, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { toast } from 'react-toastify';
//import { getNextSequentialNumber } from '../helpers/itemGen.js';

const API_URL =
  process.env.REACT_APP_BACKEND_URL ||
  `http://localhost:${process.env.REACT_APP_BACKEND_PORT || 3001}`;

/**
 * Core save function that handles both auto and manual saves
 */
export const saveItem = async ({
  item,
  messages = [],
  itemId,
  setItem,
  setUploadedImages,
  setHasUnsavedChanges,
  setLastAutoSave,
  isManual = false,
}) => {
  if (!itemId) {
    const error = 'Cannot save without a valid item ID';
    console.error(error);
    toast.error(error); // Added toast notification
    throw new Error(error);
  }

  try {
    // Ensure unique images and handle null/undefined item.images
    const images = item.images || [];
    const uniqueImageUrls = new Set(images.map(img => img.url));

    const combinedImages = [
      ...images.filter(img => uniqueImageUrls.has(img.url)),
      ...images
        .filter(img => img.file)
        .map(img => ({
          id: img.id,
          url: img.url,
          filename: img.filename,
          isNewItem: true,
        })),
    ];

    // Validate messages with more detailed error logging
    const validMessages = Array.isArray(messages)
      ? messages.filter(msg => {
          const isValid =
            typeof msg === 'object' && msg !== null && 'role' in msg && 'content' in msg;
          if (!isValid) {
            console.warn('Invalid message format:', msg);
          }
          return isValid;
        })
      : [];

    const draftData = {
      ...item,
      images: combinedImages,
      messages: validMessages,
      itemId,
      isDraft: true, // Explicitly set draft status
      updatedAt: new Date().toISOString(), // Add timestamp
    };

    // Determine endpoint based on save type
    const endpoint = isManual
      ? `${API_URL}/api/items/save-draft`
      : `${API_URL}/api/items/autosave-draft`;

    console.log(`Attempting to save draft to ${endpoint}`, { itemId });

    const response = await axios.post(endpoint, draftData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000, // 10 second timeout
    });

    if (response.status !== 200) {
      throw new Error(`Failed to save draft: ${response.statusText}`);
    }

    const savedItem = response.data.item;

    // Validate saved item
    if (!savedItem || typeof savedItem !== 'object') {
      throw new Error('Invalid response format: missing or invalid item data');
    }

    // Update states if setters are provided
    if (setItem) setItem(savedItem);
    if (setUploadedImages) setUploadedImages(savedItem.images || []);
    if (setHasUnsavedChanges) setHasUnsavedChanges(false);
    if (setLastAutoSave) setLastAutoSave(new Date());

    // Save to localStorage
    saveToLocalStorage(itemId, savedItem);

    if (isManual) {
      toast.success('Draft saved successfully!');
    }

    console.log(`${isManual ? 'Manual' : 'Auto'} save completed successfully`, { itemId });
    return savedItem;
  } catch (error) {
    console.error(`${isManual ? 'Manual' : 'Auto'} save error:`, error);
    const errorMessage = error.response?.data?.message || error.message;
    toast.error(`Failed to ${isManual ? 'save' : 'autosave'} draft: ${errorMessage}`);
    throw error;
  }
};

/**
 * Local storage management
 */
export const saveToLocalStorage = (itemId, data) => {
  try {
    if (!itemId) {
      console.error('Invalid itemId:', { itemId });
      return;
    }
    const storageKey = `item_${itemId}`;
    const dataToSave = {
      ...data,
      images: data.images || [],
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadLocalData = itemId => {
  try {
    if (!itemId) {
      console.error('Invalid itemId:', { itemId });
      return null;
    }
    const storageKey = `item_${itemId}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

export const clearLocalData = () => {
  localStorage.removeItem('currentItem');
  localStorage.removeItem('messages');
};

/**
 * Context data management
 */
export const updateContextData = (itemId, newData) => {
  try {
    const prevData = JSON.parse(localStorage.getItem(`contextData_${itemId}`)) || {};
    const updatedData = {
      ...prevData,
      ...newData,
      itemId,
    };
    localStorage.setItem(`contextData_${itemId}`, JSON.stringify(updatedData));
    return updatedData;
  } catch (error) {
    console.error('Error updating context data:', error);
    throw error;
  }
};

/**
 * Image management with enhanced error handling
 */
export const deleteImageFromServer = async ({ image, itemId, setUploadedImages, setItem }) => {
  if (!itemId || !image?.filename) {
    const error = 'ItemId and image filename are required to delete an image';
    console.error(error);
    toast.error(error);
    throw new Error(error);
  }

  try {
    const url = `${API_URL}/api/items/draft-images/delete/${itemId}/${image.filename}`;
    console.log('Attempting to delete image:', { url, itemId, filename: image.filename });

    const response = await axios.delete(url);

    if (response.data.updatedDraft) {
      // Update states if setters are provided
      if (setUploadedImages) {
        setUploadedImages(prev => prev.filter(img => img.filename !== image.filename));
      }

      if (setItem) {
        setItem(prev => ({
          ...prev,
          images: prev.images.filter(img => img.filename !== image.filename),
        }));
      }

      // Update localStorage
      saveToLocalStorage(itemId, response.data.updatedDraft);

      toast.success('Image deleted successfully');
      return response.data.updatedDraft;
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Error deleting image:', error);
    const errorMessage = error.response?.data?.message || error.message;
    toast.error(`Failed to delete image: ${errorMessage}`);
    throw error;
  }
};

/**
 * Autosave hook
 */
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
  const isProcessingRef = useRef(false);

  const saveData = useCallback(async () => {
    if (!itemId || !savedDataRef.current || isProcessingRef.current) return;

    try {
      isProcessingRef.current = true;

      await saveItem({
        item: savedDataRef.current,
        messages: savedDataRef.current.messages,
        itemId,
        setItem,
        setLastAutoSave: setLastSaved,
        isManual: false,
      });

      lastSavedRef.current = Date.now();
    } catch (error) {
      console.error('Autosave error:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [itemId, setItem, setLastSaved]);

  const debouncedSave = useMemo(() => debounce(saveData, debounceDelay), [saveData, debounceDelay]);

  const updateSavedData = useCallback(
    data => {
      if (isPaused || isProcessingRef.current) return;

      savedDataRef.current = data;
      debouncedSave();

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

export const handleLocalSave = async (item, contextData, messages, itemId) => {
  try {
    await saveItem({
      item,
      messages,
      itemId,
      isManual: false,
    });

    // Update context data
    if (contextData) {
      updateContextData(itemId, contextData);
    }

    // Save to localStorage
    saveToLocalStorage(itemId, item);

    return true;
  } catch (error) {
    console.error('Error in handleLocalSave:', error);
    throw error;
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
  try {
    const savedItem = await saveItem({
      item,
      messages,
      itemId: item.itemId,
      setItem,
      setUploadedImages,
      setHasUnsavedChanges,
      setLastAutoSave,
      isManual: true,
    });

    return savedItem;
  } catch (error) {
    console.error('Error in handleManualSave:', error);
    throw error;
  }
};

export const fetchAllItems = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/items`);
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export const deleteDraft = async itemId => {
  try {
    await axios.delete(`${API_URL}/api/items/${itemId}`);
    clearLocalData(itemId);
    return true;
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
};

export const saveDraft = async draft => {
  try {
    const response = await axios.post(`${API_URL}/api/items/draft`, draft);
    saveToLocalStorage(draft.itemId, draft);
    return response.data;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

export const deleteAllDrafts = async () => {
  try {
    await axios.delete(`${API_URL}/api/items/drafts`);
    localStorage.clear(); // Be careful with this - might want to be more selective
    return true;
  } catch (error) {
    console.error('Error deleting all drafts:', error);
    throw error;
  }
};

export const handleDraftSave = async draft => {
  try {
    const savedDraft = await saveDraft(draft);
    saveToLocalStorage(draft.itemId, draft);
    return savedDraft;
  } catch (error) {
    console.error('Error in handleDraftSave:', error);
    throw error;
  }
};

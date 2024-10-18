// frontend/src/helpers/itemGen.js

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { toast } from 'react-toastify';
import { handleDraftSave } from '../components/compSave.js';

let isItemGenerated = false;
let generatedItemId = null;
let lastUsedNumber = 0;
let isLocked = false;
let operationQueue = [];

const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || 3001;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Helper function to execute queued operations
const executeQueuedOperations = () => {
  if (operationQueue.length > 0) {
    const nextOperation = operationQueue.shift();
    nextOperation();
  } else {
    isLocked = false;
  }
};

// Wrapper function to ensure operations are performed sequentially
const withLock = (operation) => {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        executeQueuedOperations();
      }
    };

    if (isLocked) {
      operationQueue.push(execute);
    } else {
      isLocked = true;
      execute();
    }
  });
};

export const createNewItem = () => {
  return withLock(async () => {
    if (isItemGenerated) {
      toast.error('An item has already been generated.');
      throw new Error('An item has already been generated.');
    }

    try {
      const itemId = generateItemId();
      generatedItemId = itemId;
      isItemGenerated = true;

      const newItem = await createDefaultItem(itemId);

      // Save the new item using handleDraftSave from compSave
      try {
        const savedItem = await handleDraftSave(newItem, [], itemId);
        console.log('New draft item saved to database:', savedItem);
        toast.success('New draft item saved successfully');
      } catch (saveError) {
        console.error('Error saving new draft item to database:', saveError);
        toast.error('Server connection error. Draft saved locally only.');
        // Save the new item to localStorage as a fallback
        localStorage.setItem(`item_${itemId}`, JSON.stringify(newItem));
      }

      // Add a small delay to ensure localStorage is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      return itemId;
    } catch (error) {
      toast.error('Failed to create a new item. Please try again.');
      throw error; // Re-throw the error to be caught in App.js
    }
  });
};

export const getGeneratedItemId = () => {
  return withLock(async () => generatedItemId);
};

export const resetItemGeneration = () => {
  return withLock(async () => {
    isItemGenerated = false;
    generatedItemId = null;
  });
};

export const generateItemId = () => uuidv4();

export const getCurrentItemId = () => {
  return withLock(async () => generatedItemId);
};

export const setCurrentItemId = (itemId) => {
  return withLock(async () => {
    generatedItemId = itemId;
    isItemGenerated = true;
  });
};

export const generateDraftFilename = (
  itemId,
  sequentialNumber = null,
  originalFilename = 'image'
) => {
  return withLock(async () => {
    const shortId = itemId.slice(-6);

    if (sequentialNumber === null) {
      lastUsedNumber++;
      sequentialNumber = lastUsedNumber;
    } else {
      lastUsedNumber = Math.max(lastUsedNumber, sequentialNumber);
    }

    const paddedNumber = String(sequentialNumber).padStart(2, '0');

    const fileExtension = originalFilename.includes('.')
      ? originalFilename.split('.').pop().toLowerCase()
      : 'jpg';

    return `Draft-${shortId}-${paddedNumber}.${fileExtension}`;
  });
};

export const getNextSequentialNumber = async (itemId) => {
  return withLock(async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/items/draft-images/${itemId}`
      );
      return response.data.nextSequentialNumber;
    } catch (error) {
      console.error('Error getting next sequential number:', error);
      toast.error('Server connection error. Please try again later.');
      // Return a fallback value or throw an error as appropriate for your use case
      return 1; // Fallback to starting from 1 if we can't get the next number
    }
  });
};

export const createDefaultItem = async (itemId) => {
  if (!itemId) {
    toast.error('ItemId is required when creating a new item');
    throw new Error('ItemId is required when creating a new item');
  }

  try {
    // Fetch the schema fields from the backend
    const response = await axios.get(
      `${BACKEND_URL}/api/items/draft-item-schema`
    );
    const schemaData = response.data;

    // Create a new item object based on the schema fields
    const newItem = {
      itemId: itemId,
      isDraft: true,
    };

    // Check if schemaData is an object and has keys
    if (typeof schemaData === 'object' && Object.keys(schemaData).length > 0) {
      Object.keys(schemaData).forEach((field) => {
        if (field !== '_id' && field !== '__v') {
          switch (field) {
            case 'messages':
              newItem[field] = [];
              break;
            case 'vintage':
            case 'antique':
              newItem[field] = false;
              break;
            case 'images':
              newItem[field] = [];
              break;
            default:
              newItem[field] = '';
          }
        }
      });
    } else {
      console.error('Invalid schema data received:', schemaData);
      toast.error('Error creating new item: Invalid schema data');
      throw new Error('Invalid schema data received from server');
    }

    return newItem;
  } catch (error) {
    console.error('Error creating default item:', error);
    toast.error('Server connection error. Please try again later.');
    throw error; // Re-throw the error to be caught in App.js
  }
};

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export const getImageUrl = (itemId, filename) => {
  if (!itemId || !filename) return null;
  return `${backendUrl}/uploads/drafts/${itemId}/${filename}`;
};

export const checkFileExists = async (itemId, filename) => {
  try {
    const response = await fetch(
      `${backendUrl}/api/items/draft-images/check/${itemId}/${filename}`
    );
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking file existence:', error);
    toast.error('Server connection error. Please try again later.');
    return false;
  }
};

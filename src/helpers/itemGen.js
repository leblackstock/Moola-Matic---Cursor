// frontend/src/helpers/itemGen.js

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

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
      throw new Error('An item has already been generated.');
    }

    const itemId = generateItemId();
    generatedItemId = itemId;
    isItemGenerated = true;

    const newItem = createDefaultItem(itemId);

    // Save the new item to localStorage
    localStorage.setItem(`item_${itemId}`, JSON.stringify(newItem));

    // Add a small delay to ensure localStorage is updated
    await new Promise((resolve) => setTimeout(resolve, 100));

    return itemId;
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
      // Return a fallback value or throw an error as appropriate for your use case
      return 1; // Fallback to starting from 1 if we can't get the next number
    }
  });
};

export const createDefaultItem = async (itemId) => {
  if (!itemId) {
    throw new Error('ItemId is required when creating a new item');
  }

  try {
    // Fetch the schema fields from the backend
    const response = await axios.get(
      `${BACKEND_URL}/api/items/draft-item-schema`
    );
    const schemaFields = response.data.fields;

    // Create a new item object based on the schema fields
    const newItem = {
      itemId: itemId,
      isDraft: true,
    };

    // Initialize fields based on the schema
    schemaFields.forEach((field) => {
      if (field !== '_id' && field !== '__v') {
        switch (field) {
          case 'messages':
            newItem[field] = [];
            break;
          case 'vintage':
          case 'antique':
            newItem[field] = false;
            break;
          default:
            newItem[field] = '';
        }
      }
    });

    return newItem;
  } catch (error) {
    console.error('Error fetching draft item schema:', error);
    throw new Error('Failed to create default item');
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
    return false;
  }
};

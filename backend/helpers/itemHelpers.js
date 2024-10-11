// backend/helpers/itemHelpers.js

import AsyncLock from 'async-lock';
import { DraftItem } from '../models/DraftItem.js';

const lock = new AsyncLock();

// Get Next Sequential Number
export const getNextSequentialNumber = async (itemId) => {
  return lock.acquire(itemId, async () => {
    try {
      const draft = await DraftItem.findOne({ itemId });
      if (!draft || !draft.images || draft.images.length === 0) {
        return 1;
      }

      // Extract sequential numbers from existing filenames
      const sequentialNumbers = draft.images.map((img) => {
        const match = img.filename.match(/Draft-\w{6}-(\d{2})\./);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
        return 0;
      });

      const maxSequentialNumber = Math.max(...sequentialNumbers);
      return maxSequentialNumber + 1;
    } catch (error) {
      console.error('Error in getNextSequentialNumber:', error);
      throw error;
    }
  });
};

// Generate Draft Filename
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

// Generate Item ID (UUID)
export const generateItemId = () => {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4();
};

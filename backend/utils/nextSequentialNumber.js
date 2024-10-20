// backend/utils/nextSequentialNumber.js

import { withLock } from './lockUtils.js';
import { DraftItem } from '../models/draftItem.js';
import { promises as fs } from 'fs';
import path from 'path';

const MAX_RETRIES = 10;
const RETRY_DELAY = 1000; // 1 second

export const generateDraftFilename = async (itemId, file, uploadPath) => {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      return await withLock(itemId, async () => {
        const shortId = itemId.slice(-6);
        const sequentialNumber = await getNextSequentialNumber(itemId, shortId);
        const paddedNumber = String(sequentialNumber).padStart(2, '0');

        const fileExtension = file.originalname.includes('.')
          ? file.originalname.split('.').pop().toLowerCase()
          : 'jpg';

        const newFilename = `Draft-${shortId}-${paddedNumber}.${fileExtension}`;
        const newPath = path.join(uploadPath, newFilename);

        await fs.mkdir(uploadPath, { recursive: true });
        await fs.rename(file.path, newPath);
        console.log(`File renamed from ${file.path} to ${newPath}`);

        const updatedDraft = await DraftItem.findOneAndUpdate(
          { itemId: itemId },
          {
            $push: {
              images: {
                filename: newFilename,
                url: newPath,
                isNewItem: true,
              },
            },
            $set: { lastUpdated: new Date() },
          },
          { new: true }
        );

        if (!updatedDraft) {
          throw new Error(
            `Failed to update DraftItem for itemId ${itemId}. Item may have been deleted.`
          );
        }

        console.log(`DraftItem updated for itemId ${itemId}:`, updatedDraft);

        return {
          filename: newFilename,
          path: newPath,
        };
      });
    } catch (error) {
      if (error.message.includes('Failed to acquire lock')) {
        retries++;
        if (retries >= MAX_RETRIES) {
          throw new Error(
            `Failed to acquire lock after ${MAX_RETRIES} attempts`
          );
        }
        console.log(
          `Retrying lock acquisition for itemId ${itemId}, attempt ${retries}`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      } else {
        throw error;
      }
    }
  }
};

export const getNextSequentialNumber = async (itemId, shortId) => {
  return withLock(`sequential-number-${itemId}`, async () => {
    try {
      const draftItem = await DraftItem.findOne({ itemId: itemId });
      if (!draftItem) {
        throw new Error(`DraftItem not found for itemId ${itemId}`);
      }

      let sequentialNumber = 1;
      const existingFilenames = new Set(
        draftItem.images.map((img) => img.filename)
      );

      while (true) {
        const paddedNumber = String(sequentialNumber).padStart(2, '0');
        const testFilename = `Draft-${shortId}-${paddedNumber}`;

        if (
          !Array.from(existingFilenames).some(
            (filename) => filename.split('.')[0] === testFilename
          )
        ) {
          console.log(
            `Next sequential number for itemId ${itemId}: ${sequentialNumber}`
          );
          return sequentialNumber;
        }

        sequentialNumber++;
      }
    } catch (error) {
      console.error('Error getting next sequential number:', {
        error: error.message,
        itemId,
        shortId,
      });
      throw new Error('Failed to get next sequential number');
    }
  });
};

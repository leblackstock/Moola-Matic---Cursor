// backend/utils/nextSequentialNumber.js

//import mongoose from 'mongoose';
import { withLock } from './lockUtils.js';
import { DraftItem } from '../models/draftItem.js';
import { promises as fs } from 'fs';
import path from 'path';

export const generateDraftFilename = async (itemId, file, uploadPath) => {
  return withLock(`draft-filename-${itemId}`, async () => {
    const shortId = itemId.slice(-6);
    const sequentialNumber = await getNextSequentialNumber(itemId, shortId);
    const paddedNumber = String(sequentialNumber).padStart(2, '0');

    const fileExtension = file.originalname.includes('.')
      ? file.originalname.split('.').pop().toLowerCase()
      : 'jpg';

    const newFilename = `Draft-${shortId}-${paddedNumber}.${fileExtension}`;
    const newPath = path.join(uploadPath, newFilename);

    // Rename the file
    await fs.rename(file.path, newPath);

    // Update the DraftItem with the new image information
    await DraftItem.findOneAndUpdate(
      { itemId: itemId },
      {
        $push: {
          images: {
            filename: newFilename,
            path: newPath,
          },
        },
        lastUpdated: new Date(),
      },
      { new: true, upsert: true }
    );

    return {
      filename: newFilename,
      path: newPath,
    };
  });
};

export const getNextSequentialNumber = async (itemId, shortId) => {
  return withLock(`sequential-number-${itemId}`, async () => {
    try {
      const draftItem = await DraftItem.findOne({ itemId: itemId });
      if (!draftItem) {
        throw new Error('Draft item not found');
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

// No need for module.exports in ES modules

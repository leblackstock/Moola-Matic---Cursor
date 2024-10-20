// backend/helpers/itemHelpers.js

import AsyncLock from 'async-lock';
import { DraftItem } from '../models/draftItem.js';
import winston from 'winston';

const lock = new AsyncLock();

// Set up Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/itemHelpers.log' }),
  ],
});

// Get Next Sequential Number
export const getNextSequentialNumber = async (itemId) => {
  logger.info(`Getting next sequential number for itemId: ${itemId}`);
  try {
    const draft = await DraftItem.findOne({ itemId });
    if (!draft) {
      logger.info(`No draft found for itemId: ${itemId}, returning 1`);
      return 1;
    }

    const sequentialNumbers = draft.images.map((img) => {
      const match = img.filename.match(/Draft-\w{6}-(\d{2})\./);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxNumber = Math.max(...sequentialNumbers, 0);
    const nextNumber = maxNumber + 1;
    logger.info(`Next sequential number for itemId ${itemId}: ${nextNumber}`);
    return nextNumber;
  } catch (error) {
    logger.error(
      `Error in getNextSequentialNumber for itemId ${itemId}:`,
      error
    );
    throw error;
  }
};

// Generate Draft Filename
export const generateDraftFilename = (
  itemId,
  sequentialNumber = 1,
  originalFilename = 'image'
) => {
  logger.info(
    `Generating draft filename for itemId: ${itemId}, sequentialNumber: ${sequentialNumber}`
  );
  const fileExtension = originalFilename.includes('.')
    ? originalFilename.split('.').pop().toLowerCase()
    : 'jpg';
  const paddedSequentialNumber = String(sequentialNumber).padStart(2, '0');
  const filename = `Draft-${itemId.slice(-6)}-${paddedSequentialNumber}.${fileExtension}`;
  logger.info(`Generated filename: ${filename}`);
  return filename;
};

// New function to handle file upload and sequential number generation
export const handleFileUploadAndSequentialNumber = async (
  itemId,
  originalFilename
) => {
  logger.info(
    `Handling file upload and sequential number for itemId: ${itemId}`
  );
  return await lock.acquire(itemId, async () => {
    const sequentialNumber = await getNextSequentialNumber(itemId);
    const filename = generateDraftFilename(
      itemId,
      sequentialNumber,
      originalFilename
    );

    logger.info(
      `File upload handled for itemId: ${itemId}, sequentialNumber: ${sequentialNumber}, filename: ${filename}`
    );
    return { sequentialNumber, filename };
  });
};

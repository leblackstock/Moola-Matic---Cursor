// backend/utils/lockUtils.js

import { DraftItem } from '../models/draftItem.js';
import { promises as fs } from 'fs';

const LOCK_DURATION = 30000; // 30 seconds

export const withLock = async (lockKey, callback) => {
  try {
    await acquireLock(lockKey);
    const result = await callback();
    await releaseLock(lockKey);
    return result;
  } catch (error) {
    await releaseLock(lockKey);
    throw error;
  }
};

export const acquireLock = async lockKey => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_DURATION);

  const result = await DraftItem.findOneAndUpdate(
    {
      itemId: lockKey,
      $or: [{ lockedAt: { $exists: false } }, { expiresAt: { $lt: now } }],
    },
    {
      lockedAt: now,
      expiresAt: expiresAt,
    },
    { new: true, upsert: true }
  );

  if (!result) {
    throw new Error(`Failed to acquire lock for ${lockKey}`);
  }
};

export const releaseLock = async lockKey => {
  await DraftItem.findOneAndUpdate(
    { itemId: lockKey },
    {
      $unset: { lockedAt: '', expiresAt: '' },
    }
  );
};

export const checkAndRenameFile = async (oldFilename, newFilename) => {
  return withLock(`rename-${oldFilename}`, async () => {
    try {
      if (
        await fs
          .access(newFilename)
          .then(() => true)
          .catch(() => false)
      ) {
        throw new Error('New filename already exists');
      }

      await fs.rename(oldFilename, newFilename);
      console.log(`File renamed from ${oldFilename} to ${newFilename}`);
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  });
};

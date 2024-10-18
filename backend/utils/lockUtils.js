// backend/utils/lockUtils.js

import fs from 'fs/promises';
import path from 'path';

const lockDir = path.join(process.cwd(), 'locks');

async function ensureLockDirectoryExists() {
  try {
    await fs.mkdir(lockDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function acquireLock(lockName, maxRetries = 10, retryDelay = 100) {
  await ensureLockDirectoryExists();
  const lockFile = path.join(lockDir, `${lockName}.lock`);

  for (let i = 0; i < maxRetries; i++) {
    try {
      await fs.writeFile(lockFile, '', { flag: 'wx' });
      return lockFile; // Return the lockFile path
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error; // Unexpected error
      }
      // Lock file exists, wait and retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error(`Failed to acquire lock: ${lockName}`);
}

export async function releaseLock(lockFile) {
  try {
    await fs.unlink(lockFile);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error; // Unexpected error
    }
    // Lock file doesn't exist, it's already released
  }
}

export async function withLock(lockName, fn) {
  let lockFile;
  try {
    lockFile = await acquireLock(lockName);
    return await fn();
  } finally {
    if (lockFile) {
      await releaseLock(lockFile);
    }
  }
}

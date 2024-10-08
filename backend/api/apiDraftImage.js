// backend/api/apiDraftImage.js

import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post('/save', async (req, res) => {
  try {
    const { itemId, tempPath, originalFilename } = req.body;

    if (!itemId || !tempPath || !originalFilename) {
      return res.status(400).json({ error: 'Missing required information' });
    }

    const draftsDir = path.join(__dirname, '..', '..', 'uploads', 'drafts', itemId);
    await fs.mkdir(draftsDir, { recursive: true });

    const newFilename = `draft-${Date.now()}${path.extname(originalFilename)}`;
    const newPath = path.join(draftsDir, newFilename);

    await fs.rename(tempPath, newPath);

    // Create a URL-friendly path
    const urlPath = `/uploads/drafts/${itemId}/${newFilename}`;

    res.json({ 
      draftPath: urlPath,
      filename: newFilename
    });
  } catch (error) {
    console.error('Error saving draft image:', error);
    res.status(500).json({ error: 'Failed to save draft image' });
  }
});

export default router;

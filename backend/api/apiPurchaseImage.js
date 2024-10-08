// backend/api/apiPurchaseImage.js


import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post('/save', async (req, res) => {
  try {
    const { itemId, imagePath, originalFilename, isTemp } = req.body;

    if (!itemId || !imagePath || !originalFilename) {
      return res.status(400).json({ error: 'Missing required information' });
    }

    const purchasedDir = path.join(__dirname, '..', '..', 'uploads', 'purchased', itemId);
    await fs.mkdir(purchasedDir, { recursive: true });

    const newFilename = `purchased-${Date.now()}${path.extname(originalFilename)}`;
    const newPath = path.join(purchasedDir, newFilename);

    await fs.rename(imagePath, newPath);

    if (!isTemp) {
      const draftDir = path.dirname(imagePath);
      await fs.rmdir(draftDir, { recursive: true });
    }

    res.json({ 
      purchasedPath: newPath,
      filename: newFilename
    });
  } catch (error) {
    console.error('Error saving purchased image:', error);
    res.status(500).json({ error: 'Failed to save purchased image' });
  }
});

export default router;


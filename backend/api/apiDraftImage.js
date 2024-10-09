// backend/api/apiDraftImage.js

import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Set up multer to store files in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    console.log('Upload completed');
    console.log('Request body after upload:', req.body);
    console.log('Request file after upload:', req.file);

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.body.itemId) {
      console.log('No itemId provided');
      return res.status(400).json({ error: 'itemId is required' });
    }

    const itemId = req.body.itemId;
    const providedFilename = req.body.filename;

    if (!providedFilename) {
      console.log('No filename provided');
      return res.status(400).json({ error: 'filename is required' });
    }

    // Create the drafts directory if it doesn't exist
    const draftsDir = path.join(__dirname, '..', '..', 'uploads', 'drafts');
    await fs.mkdir(draftsDir, { recursive: true });

    // Write the file to disk with the provided filename
    const filePath = path.join(draftsDir, providedFilename);
    await fs.writeFile(filePath, req.file.buffer);

    const urlPath = `/uploads/drafts/${providedFilename}`;

    console.log('File saved:', providedFilename);
    console.log('URL path:', urlPath);

    res.json({
      imageUrl: urlPath,
      filename: providedFilename,
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    res
      .status(500)
      .json({
        error: 'An error occurred while processing the upload',
        details: error.message,
      });
  }
});

export default router;

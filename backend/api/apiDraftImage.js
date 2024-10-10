// backend/api/apiDraftImage.js

import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { generateDraftFilename } from '../../src/components/compSave.js';
import { DraftItem } from '../models/DraftItem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { itemId } = req.body;

    if (!itemId) {
      console.log('itemId is missing');
      return res.status(400).json({ error: 'itemId is required' });
    }

    const uploadDir = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'drafts',
      itemId
    );

    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.error('Error creating upload directory:', mkdirError);
      return res
        .status(500)
        .json({ error: 'Failed to create upload directory' });
    }

    // Get the count of existing images for this item
    const draftItem = await DraftItem.findOne({ itemId });
    const existingImagesCount = draftItem ? draftItem.images.length : 0;
    const sequentialNumber = existingImagesCount + 1;

    const filename = generateDraftFilename(
      itemId,
      sequentialNumber,
      req.file.originalname
    );
    const newPath = path.join(uploadDir, filename);

    try {
      await fs.writeFile(newPath, req.file.buffer);
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return res.status(500).json({ error: 'Failed to write file' });
    }

    const url = `/uploads/drafts/${itemId}/${filename}`;

    console.log('File uploaded successfully:', url);

    // Update the DraftItem document to add the new image
    const updatedDraft = await DraftItem.findOneAndUpdate(
      { itemId: itemId },
      {
        $push: {
          images: {
            id: `image-${Date.now()}`,
            url: url,
            filename: filename,
          },
        },
      },
      { new: true, upsert: true }
    );

    if (!updatedDraft) {
      console.log(`Failed to update draft for itemId: ${itemId}`);
      return res.status(500).json({ error: 'Failed to update draft' });
    }

    res.json({
      id: `image-${Date.now()}`,
      url: url,
      filename: filename,
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({
      error: 'An error occurred while processing the upload',
      details: error.message,
    });
  }
});

// Helper function to check if a file exists
// async function fileExists(filePath) {
//   try {
//     await fs.access(filePath);
//     return true;
//   } catch {
//     return false;
//   }
// }

router.delete('/:itemId/:filename', async (req, res) => {
  try {
    const { itemId, filename } = req.params;
    console.log(`Attempting to delete image: ${filename} for item: ${itemId}`);

    const imagePath = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'drafts',
      itemId,
      filename
    );

    // Check if the file exists before attempting to delete
    try {
      await fs.access(imagePath);
    } catch (error) {
      console.log(`File not found: ${imagePath}`);
      return res.status(404).json({ error: 'Image file not found' });
    }

    await fs.unlink(imagePath);
    console.log(`Successfully deleted image file: ${imagePath}`);

    // Attempt to remove the itemId directory if it's empty
    const itemDir = path.dirname(imagePath);
    try {
      await fs.rmdir(itemDir);
      console.log(`Successfully removed empty directory: ${itemDir}`);
    } catch (error) {
      // Ignore error if directory is not empty or doesn't exist
      console.log(`Could not remove directory ${itemDir}: ${error.message}`);
    }

    // Update the DraftItem document to remove the image reference
    const updatedDraft = await DraftItem.findOneAndUpdate(
      { itemId: itemId },
      { $pull: { images: { filename: filename } } },
      { new: true, runValidators: false } // Add runValidators: false to skip validation
    );

    if (!updatedDraft) {
      console.log(`No draft found for itemId: ${itemId}`);
      return res.status(404).json({ error: 'Draft not found' });
    }

    console.log(`Successfully updated draft for item: ${itemId}`);
    res.json({ message: 'Image deleted successfully', updatedDraft });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      error: 'An error occurred while deleting the image',
      details: error.message,
      stack: error.stack, // Include stack trace for debugging
    });
  }
});

export default router;

// backend/api/apiDraftImage.js

import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { DraftItem } from '../models/DraftItem.js';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating image IDs

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper Function: Get Next Sequential Number
async function getNextSequentialNumber(itemId) {
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
}

// Helper Function: Generate Draft Filename
function generateDraftFilename(
  itemId,
  sequentialNumber = 1,
  originalFilename = 'image'
) {
  const fileExtension = originalFilename.includes('.')
    ? originalFilename.split('.').pop().toLowerCase()
    : 'jpg';
  const paddedSequentialNumber = String(sequentialNumber).padStart(2, '0');
  return `Draft-${itemId.slice(-6)}-${paddedSequentialNumber}.${fileExtension}`;
}

// POST /upload - Upload a new image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { itemId, fileExtension } = req.body;

    if (!itemId || !fileExtension) {
      console.log('Missing required parameters');
      return res.status(400).json({
        error: 'itemId and fileExtension are required',
      });
    }

    const uploadDir = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'drafts',
      itemId
    );

    // Create the upload directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.error('Error creating upload directory:', mkdirError);
      return res
        .status(500)
        .json({ error: 'Failed to create upload directory' });
    }

    // Get the next sequential number
    const nextSequentialNumber = await getNextSequentialNumber(itemId);

    // Generate the new filename
    const filename = generateDraftFilename(
      itemId,
      nextSequentialNumber,
      `file.${fileExtension}`
    );
    const newPath = path.join(uploadDir, filename);

    // Write the file to the filesystem
    try {
      await fs.writeFile(newPath, req.file.buffer);
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return res.status(500).json({ error: 'Failed to write file' });
    }

    const url = `/uploads/drafts/${itemId}/${filename}`;

    // Update the DraftItem document with the new image
    try {
      const updatedDraft = await DraftItem.findOneAndUpdate(
        { itemId: itemId },
        {
          $push: {
            images: {
              id: uuidv4(),
              url: url,
              filename: filename,
              isNew: true,
            },
          },
          lastUpdated: new Date(),
        },
        { new: true, upsert: true } // Create draft if it doesn't exist
      );

      console.log('File uploaded and draft updated successfully:', filename);
      res.json({
        url: url,
        filename: filename,
        message: 'File uploaded and draft updated successfully',
        updatedDraft: updatedDraft,
      });
    } catch (dbError) {
      console.error('Error updating draft with new image:', dbError);
      return res
        .status(500)
        .json({ error: 'Failed to update draft with new image' });
    }
  } catch (error) {
    console.error('Error processing upload:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while processing the upload' });
  }
});

// DELETE /:itemId/:filename - Delete an image
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

    // Check if the file exists
    try {
      await fs.access(imagePath);
    } catch (error) {
      console.log(`File not found: ${imagePath}`);
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Delete the image file
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

    // Remove the image reference from the DraftItem document
    const updatedDraft = await DraftItem.findOneAndUpdate(
      { itemId: itemId },
      { $pull: { images: { filename: filename } } },
      { new: true, runValidators: false } // Skip validation
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

// GET /next-sequence/:itemId - Get next sequential number
router.get('/next-sequence/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const nextSequentialNumber = await getNextSequentialNumber(itemId);
    res.json({ nextSequentialNumber });
  } catch (error) {
    console.error('Error getting next sequential number:', error);
    res.status(500).json({ error: 'Failed to get next sequential number' });
  }
});

export default router;

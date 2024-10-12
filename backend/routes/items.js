import express from 'express';
import multer from 'multer';
import { DraftItem } from '../models/DraftItem.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import {
  generateDraftFilename,
  getNextSequentialNumber,
} from '../helpers/itemHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ------------------------------
// General Item Routes (Existing)
// ------------------------------

// Example: GET /api/items/:id
router.get('/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await DraftItem.findOne({ itemId });

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ... [Other existing item routes] ...

// ------------------------------
// Draft Image Routes (New)
// ------------------------------

// POST /api/items/draft-images/upload - Upload a new draft image
router.post(
  '/draft-images/upload',
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { itemId } = req.body;

      if (!itemId) {
        console.log('Missing itemId');
        return res.status(400).json({ error: 'itemId is required' });
      }

      const uploadDir = path.join(__dirname, '..', 'uploads', 'drafts', itemId);

      // Create the upload directory if it doesn't exist
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (mkdirError) {
        console.error('Error creating upload directory:', mkdirError);
        return res
          .status(500)
          .json({ error: 'Failed to create upload directory' });
      }

      // Determine filename
      const sequentialNumber = await getNextSequentialNumber(itemId);
      const newFilename = generateDraftFilename(
        itemId,
        sequentialNumber,
        req.file.originalname
      );

      const filePath = path.join(uploadDir, newFilename);

      // Write the file to disk
      await fs.writeFile(filePath, req.file.buffer);

      const url = `/uploads/drafts/${itemId}/${newFilename}`;

      // Update the DraftItem document with the new image
      const updatedDraft = await DraftItem.findOneAndUpdate(
        { itemId: itemId },
        {
          $push: {
            images: {
              id: uuidv4(),
              url: url,
              filename: newFilename,
              isNew: true,
            },
          },
          lastUpdated: new Date(),
        },
        { new: true, upsert: true }
      );

      console.log('File uploaded and draft updated successfully:', newFilename);
      res.json({
        url: url,
        filename: newFilename,
        message: 'File uploaded and draft updated successfully',
        updatedDraft: updatedDraft,
      });
    } catch (error) {
      console.error('Detailed error in image upload:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        error: 'An error occurred while uploading the image',
        details: error.message,
        stack: error.stack,
      });
    }
  }
);

// GET /api/items/draft-images/next-sequence/:itemId - Get next sequential number
router.get('/draft-images/next-sequence/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const nextSequentialNumber = await getNextSequentialNumber(itemId);
    res.json({ nextSequentialNumber });
  } catch (error) {
    console.error('Error getting next sequential number:', error);
    res.status(500).json({ error: 'Failed to get next sequential number' });
  }
});

// DELETE /api/items/draft-images/delete/:itemId/:filename - Delete an image
router.delete('/draft-images/delete/:itemId/:filename', async (req, res) => {
  try {
    const { itemId, filename } = req.params;
    console.log(`Attempting to delete image: ${filename} for item: ${itemId}`);

    const imagePath = path.join(
      __dirname,
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

// GET /api/items/draft-images/:itemId/:filename - Serve a specific image
router.get('/draft-images/:itemId/:filename', async (req, res) => {
  try {
    const { itemId, filename } = req.params;
    const imagePath = path.join(
      __dirname,
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
      return res.status(404).send('Image not found');
    }

    // Determine the content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
      }[ext] || 'application/octet-stream';

    // Set the content type
    res.contentType(contentType);

    // Stream the file to the response
    const fileStream = fs.createReadStream(imagePath);
    fileStream.pipe(res);

    console.log(`Successfully served image: ${filename} for item: ${itemId}`);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).send('Error serving image');
  }
});

// GET all items
router.get('/', async (req, res) => {
  try {
    const items = await DraftItem.find();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET all drafts
router.get('/drafts', async (req, res) => {
  try {
    const drafts = await DraftItem.find({ isDraft: true });
    console.log('Fetched drafts:', drafts);
    res.json(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ error: 'Error fetching drafts' });
  }
});

// DELETE /api/items/drafts/:id - Delete a specific draft
router.delete('/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteImages = req.query.deleteImages === 'true';
    console.log('Attempting to delete draft with ID:', id);

    let result;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // If it's a valid MongoDB ObjectId
      result = await DraftItem.findByIdAndDelete(id);
    } else {
      // If it's not a MongoDB ObjectId, assume it's a UUID
      result = await DraftItem.findOneAndDelete({ itemId: id });
    }

    if (!result) {
      console.log('Draft not found for deletion');
      return res.status(404).json({ error: 'Draft not found' });
    }

    if (deleteImages) {
      // Delete the image folder
      const imageFolderPath = path.join(
        __dirname,
        '..',
        'uploads',
        'drafts',
        result.itemId
      );
      if (
        await fs
          .access(imageFolderPath)
          .then(() => true)
          .catch(() => false)
      ) {
        await fs.rm(imageFolderPath, { recursive: true, force: true });
        console.log(`Deleted image folder: ${imageFolderPath}`);
      }
    }

    console.log('Draft deleted successfully:', result);
    res.json({ message: 'Draft deleted successfully', deletedDraft: result });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res
      .status(500)
      .json({ error: 'Failed to delete draft', details: error.message });
  }
});

// DELETE /api/items/drafts - Delete all drafts
router.delete('/drafts', async (req, res) => {
  try {
    const deleteImages = req.query.deleteImages === 'true';

    const drafts = await DraftItem.find({});
    await DraftItem.deleteMany({});

    if (deleteImages) {
      const draftsFolderPath = path.join(__dirname, '..', 'uploads', 'drafts');
      for (const draft of drafts) {
        const imageFolderPath = path.join(draftsFolderPath, draft.itemId);
        if (
          await fs
            .access(imageFolderPath)
            .then(() => true)
            .catch(() => false)
        ) {
          await fs.rm(imageFolderPath, { recursive: true, force: true });
          console.log(`Deleted image folder: ${imageFolderPath}`);
        }
      }
    }

    res.json({ message: 'All drafts deleted successfully' });
  } catch (error) {
    console.error('Error deleting all drafts:', error);
    res
      .status(500)
      .json({ error: 'Failed to delete all drafts', details: error.message });
  }
});

// POST /api/items - Create a new item
router.post('/', async (req, res) => {
  try {
    const newItem = new DraftItem(req.body);
    const savedItem = await newItem.save();
    console.log('New item saved:', savedItem);
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error saving item:', error);
    res
      .status(500)
      .json({ error: 'Failed to save item', details: error.message });
  }
});

// PUT /api/items/:id - Update an existing item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedItem = await DraftItem.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    console.log('Item updated:', updatedItem);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res
      .status(500)
      .json({ error: 'Failed to update item', details: error.message });
  }
});

// POST /api/items/save-draft - Save a draft item
router.post('/save-draft', async (req, res) => {
  try {
    const itemData = req.body;

    if (!itemData.itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    let draft = await DraftItem.findOneAndUpdate(
      { itemId: itemData.itemId },
      { ...itemData, lastUpdated: new Date() },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log('Draft saved:', draft);
    res.status(200).json({ item: draft });
  } catch (error) {
    console.error('Error saving draft:', error);
    res
      .status(500)
      .json({ error: 'Failed to save draft', details: error.message });
  }
});

// POST /api/items/autosave-draft - Autosave a draft item
router.post('/autosave-draft', async (req, res) => {
  try {
    const { draftData, contextData, messages } = req.body;

    // Handle the purchaseRecommendation field
    if (
      draftData.finalRecommendation &&
      draftData.finalRecommendation.purchaseRecommendation !== undefined
    ) {
      if (
        draftData.finalRecommendation.purchaseRecommendation === 'Unknown' ||
        draftData.finalRecommendation.purchaseRecommendation === ''
      ) {
        draftData.finalRecommendation.purchaseRecommendation = null;
      } else if (
        typeof draftData.finalRecommendation.purchaseRecommendation === 'string'
      ) {
        draftData.finalRecommendation.purchaseRecommendation =
          draftData.finalRecommendation.purchaseRecommendation.toLowerCase() ===
          'true';
      }
    }

    let draft = await DraftItem.findOneAndUpdate(
      { itemId: draftData.itemId },
      { ...draftData, lastUpdated: new Date() },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log('Draft autosaved');
    res.status(200).json({ item: draft });
  } catch (error) {
    console.error('Error autosaving draft:', error);
    res
      .status(500)
      .json({ error: 'Failed to autosave draft', details: error.message });
  }
});

export default router;

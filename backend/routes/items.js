import express from 'express';
import multer from 'multer';
import { DraftItem } from '../models/draftItem.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { performance } from 'perf_hooks';
import { generateDraftFilename } from '../utils/nextSequentialNumber.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const itemId = req.body.itemId || 'temp';
    const uploadPath = path.join(__dirname, '..', 'uploads', 'drafts', itemId);
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
}).array('images', 10); // Allow up to 10 images

// POST /api/items/draft-images/upload
router.post('/draft-images/upload', (req, res) => {
  const startTime = performance.now();
  const timeout = 120000; // 2 minutes

  upload(req, res, async function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: 'File upload failed', details: err.message });
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    );

    try {
      await Promise.race([
        (async () => {
          const itemId = req.body.itemId || 'temp';
          const uploadPath = path.join(
            __dirname,
            '..',
            'uploads',
            'drafts',
            itemId
          );

          const uploadedFiles = await Promise.all(
            req.files.map(async (file) =>
              generateDraftFilename(itemId, file, uploadPath)
            )
          );

          const endTime = performance.now();
          console.log(`Upload operation completed in ${endTime - startTime}ms`);
          res.json({
            message: 'Files uploaded successfully',
            uploadedFiles: uploadedFiles,
          });
        })(),
        timeoutPromise,
      ]);
    } catch (error) {
      console.error('Error in file upload:', error);
      res
        .status(error.message === 'Operation timed out' ? 504 : 500)
        .json({ error: error.message });
    }
  });
});

// GET /api/items/draft-item-schema
router.get('/draft-item-schema', async (req, res) => {
  try {
    const schema = DraftItem.schema.obj;
    res.json(schema);
  } catch (error) {
    console.error('Error fetching draft item schema:', error);
    res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/items/:id
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

// GET /api/items/draft-images/:itemId/:filename
router.get('/draft-images/:itemId/:filename', async (req, res) => {
  const { itemId, filename } = req.params;
  const imagePath = path.join(
    __dirname,
    '..',
    'uploads',
    'drafts',
    itemId,
    filename
  );

  try {
    await fs.access(imagePath);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for this route
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error(`Error sending file: ${err}`);
        res.status(err.status || 500).end();
      }
    });
  } catch (error) {
    console.error(`Error serving image: ${error}`);
    res.status(404).json({ error: 'Image not found', details: error.message });
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
      {
        ...draftData,
        contextData, // Save contextData
        messages, // Save messages
        lastUpdated: new Date(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log('Draft autosaved with contextData and messages');
    res.status(200).json({ item: draft });
  } catch (error) {
    console.error('Error autosaving draft:', error);
    res
      .status(500)
      .json({ error: 'Failed to autosave draft', details: error.message });
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

export default router;

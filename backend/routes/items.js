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
    console.log('Multer destination function called');
    const itemId = req.body.itemId || 'temp';
    const uploadPath = path.join(__dirname, '..', 'uploads', 'drafts', itemId);
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => {
        console.log(`Created directory: ${uploadPath}`);
        cb(null, uploadPath);
      })
      .catch((err) => {
        console.error(`Error creating directory: ${uploadPath}`, err);
        cb(err);
      });
  },
  filename: (req, file, cb) => {
    // Use a temporary filename, it will be renamed later
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log(`Uploading file: ${file.originalname}`);
    cb(null, true);
  },
}).array('images', 10); // Allow up to 10 images

// POST /api/items/draft-images/upload
router.post('/draft-images/upload', (req, res) => {
  console.log('Received upload request');

  const startTime = performance.now();
  const timeout = 120000; // 2 minutes

  upload(req, res, async function (err) {
    if (err) {
      // ... (keep existing error handling)
    }

    console.log('log 03 - No errors in upload');
    console.log('Parsed request body:', req.body);
    console.log('Uploaded files:', req.files);

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
            req.files.map(async (file) => {
              return generateDraftFilename(itemId, file, uploadPath);
            })
          );

          console.log('log 07 - Files processed:', uploadedFiles);

          const endTime = performance.now();
          console.log(
            `log 08 - Upload operation completed in ${endTime - startTime}ms`
          );
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

// DELETE /api/items/draft-images/delete/:itemId/:filename
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
    await fs.access(imagePath);

    // Delete the image file
    await fs.unlink(imagePath);
    console.log(`Successfully deleted image file: ${imagePath}`);

    // Remove the image reference from the DraftItem document
    const updatedDraft = await DraftItem.findOneAndUpdate(
      { itemId: itemId },
      { $pull: { images: { filename: filename } } },
      { new: true }
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
    res.sendFile(imagePath);
  } catch (error) {
    console.error(`Error serving image: ${error}`);
    res.status(404).send('Image not found');
  }
});

// POST /api/items/save-draft
router.post('/save-draft', async (req, res) => {
  try {
    const { itemId, isDraft, ...itemData } = req.body;

    let draftItem = await DraftItem.findOne({ itemId });

    if (draftItem) {
      // Update existing draft
      Object.assign(draftItem, { ...itemData, isDraft: true });
    } else {
      // Create new draft
      draftItem = new DraftItem({ itemId, isDraft: true, ...itemData });
    }

    await draftItem.save();

    res.json({ message: 'Draft saved successfully', item: draftItem });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'An error occurred while saving the draft' });
  }
});

export default router;

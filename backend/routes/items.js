import express from 'express';
import multer from 'multer';
import { DraftItem } from '../models/draftItem.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { handleFileUploadAndSequentialNumber } from '../helpers/itemHelpers.js';
import winston from 'winston';
import { rateLimitedRequest } from '../utils/rateLimiter.js';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const itemId = req.body.itemId || 'temp';
    const uploadPath = path.join(__dirname, '..', 'uploads', 'drafts', itemId);
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        console.error(`Error creating directory: ${uploadPath}`, err);
        cb(err);
      } else {
        console.log(`Created directory: ${uploadPath}`);
        cb(null, uploadPath);
      }
    });
  },
  filename: (req, file, cb) => {
    const itemId = req.body.itemId || 'temp';
    const sequentialNumber = req.body.sequentialNumber || '01';
    const fileExtension = path.extname(file.originalname);
    const newFilename = `Draft-${itemId.slice(-6)}-${sequentialNumber}${fileExtension}`;
    cb(null, newFilename);
  },
});

const upload = multer({ storage: storage });

// Set up Winston logger
const logger = winston.createLogger({
  level: 'debug', // Changed to 'debug' for more verbose logging
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/items.log' }),
  ],
});

// Add this new route near the top of your file, after the imports and router initialization
router.get('/draft-item-schema', (req, res) => {
  const schemaFields = Object.keys(DraftItem.schema.paths);
  res.json({ fields: schemaFields });
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

// POST /api/items/draft-images/upload
router.post(
  '/draft-images/upload',
  upload.single('image'),
  async (req, res) => {
    logger.info('Received request to upload draft image', {
      method: 'POST',
      path: '/api/items/draft-images/upload',
    });

    try {
      await rateLimitedRequest(async () => {
        const { itemId } = req.body;
        const file = req.file;

        logger.debug('Request details', {
          itemId,
          file: file
            ? {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
              }
            : null,
        });

        if (!itemId || !file) {
          logger.warn('Missing itemId or file in request', {
            itemId,
            fileExists: !!file,
          });
          return res.status(400).json({ error: 'Missing itemId or file' });
        }

        logger.info(`Processing file upload for itemId: ${itemId}`);

        const { filename } = await handleFileUploadAndSequentialNumber(
          itemId,
          file.originalname
        );
        logger.info(`Generated filename for upload`, { itemId, filename });

        const uploadDir = path.join(
          __dirname,
          '..',
          'uploads',
          'drafts',
          itemId
        );
        const filePath = path.join(uploadDir, filename);

        logger.debug('File paths', { uploadDir, filePath });

        await fs.mkdir(uploadDir, { recursive: true });

        // Use streams for file operations
        try {
          await pipeline(
            createReadStream(file.path),
            createWriteStream(filePath)
          );
        } catch (error) {
          // Fallback for older Node.js versions or if pipeline fails
          await new Promise((resolve, reject) => {
            const readStream = createReadStream(file.path);
            const writeStream = createWriteStream(filePath);

            readStream.on('error', reject);
            writeStream.on('error', reject);
            writeStream.on('finish', resolve);

            readStream.pipe(writeStream);
          });
        }

        await fs.unlink(file.path);

        logger.debug('Updating DraftItem in database', { itemId, filename });
        const draftItem = await DraftItem.findOneAndUpdate(
          { itemId },
          { $push: { images: { filename } } },
          { new: true, upsert: true }
        );
        logger.info(`Updated DraftItem for itemId: ${itemId}`, {
          draftItemId: draftItem._id,
          imagesCount: draftItem.images.length,
        });

        const responseData = {
          filename,
          message: 'File uploaded successfully',
          url: `/uploads/drafts/${itemId}/${filename}`,
          id: draftItem.images[draftItem.images.length - 1]._id,
        };
        logger.info('File upload successful', {
          itemId,
          filename,
          url: responseData.url,
          imageId: responseData.id,
        });
        res.json(responseData);
      });
    } catch (error) {
      logger.error('Error in file upload route:', {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);

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
    await fs.promises.access(imagePath);
    res.sendFile(imagePath);
  } catch (error) {
    console.error(`Error serving image: ${error}`);
    res.status(404).send('Image not found');
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

// Helper function for recursive deletion
async function recursiveDelete(directoryPath) {
  try {
    // Check if the directory exists
    try {
      await fs.access(directoryPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Directory does not exist: ${directoryPath}`);
        return; // Exit the function if the directory doesn't exist
      }
      throw error; // Re-throw other errors
    }

    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        await recursiveDelete(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }

    await fs.rmdir(directoryPath);
    console.log(`Successfully deleted directory: ${directoryPath}`);
  } catch (error) {
    console.error(`Error deleting directory ${directoryPath}:`, error);
    throw error;
  }
}

// DELETE /api/items/drafts/:id
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
      await recursiveDelete(imageFolderPath);
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
    const drafts = await DraftItem.find({ isDraft: true });

    for (const draft of drafts) {
      if (deleteImages && draft.itemId) {
        const imageFolderPath = path.join(
          __dirname,
          '..',
          'uploads',
          'drafts',
          draft.itemId
        );
        await recursiveDelete(imageFolderPath);
      }
    }

    const result = await DraftItem.deleteMany({ isDraft: true });

    console.log(`Deleted ${result.deletedCount} drafts`);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting all drafts:', error);
    res
      .status(500)
      .json({ success: false, error: error.message, stack: error.stack });
  }
});

// POST /api/items
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

// PUT /api/items/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedItem = await DraftItem.findOneAndUpdate(
      { itemId: id },
      updateData,
      { new: true, runValidators: true }
    );

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

// POST /api/items/save-draft
router.post('/save-draft', async (req, res) => {
  try {
    const itemData = req.body;

    if (!itemData.itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    // Handle date fields
    const dateFields = [
      'purchaseDate',
      'listingDate',
      'inventoryDetailsAcquisitionDate',
    ];
    dateFields.forEach((field) => {
      if (itemData[field]) {
        itemData[field] = new Date(itemData[field]);
      }
    });

    // Handle numeric fields
    const numericFields = [
      'conditionEstimatedRepairCosts',
      'conditionEstimatedCleaningCosts',
      'financialsPurchasePrice',
      'financialsTotalRepairAndCleaningCosts',
      'financialsEstimatedShippingCosts',
      'financialsPlatformFees',
      'financialsExpectedProfit',
      'financialsProfitMargin',
      'financialsEstimatedMarketValue',
      'financialsAcquisitionCost',
      'marketAnalysisSuggestedListingPrice',
      'marketAnalysisMinimumAcceptablePrice',
    ];
    numericFields.forEach((field) => {
      if (itemData[field] !== undefined && itemData[field] !== '') {
        itemData[field] = Number(itemData[field]);
      }
    });

    // Ensure images are properly formatted
    if (itemData.images && Array.isArray(itemData.images)) {
      itemData.images = itemData.images.map((image) => ({
        id: image.id,
        url: image.url,
        filename: image.filename,
        isNew: image.isNew,
      }));
    }

    let draft = await DraftItem.findOneAndUpdate(
      { itemId: itemData.itemId },
      { ...itemData, lastUpdated: new Date(), isDraft: true },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log('Draft saved:');
    res.status(200).json({ item: draft });
  } catch (error) {
    console.error('Error saving draft:', error);
    res
      .status(500)
      .json({ error: 'Failed to save draft', details: error.message });
  }
});

// POST /api/items/autosave-draft
router.post('/autosave-draft', async (req, res) => {
  try {
    const { draftData, contextData, messages } = req.body;

    if (!draftData.itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    // Handle the purchaseRecommendation field
    if (draftData.purchaseRecommendation !== undefined) {
      if (
        draftData.purchaseRecommendation === 'Unknown' ||
        draftData.purchaseRecommendation === ''
      ) {
        draftData.purchaseRecommendation = null;
      }
    }

    // Convert date strings to Date objects
    const dateFields = [
      'purchaseDate',
      'listingDate',
      'inventoryDetailsAcquisitionDate',
    ];
    dateFields.forEach((field) => {
      if (draftData[field]) {
        draftData[field] = new Date(draftData[field]);
      }
    });

    // Convert numeric fields to Numbers
    const numericFields = [
      'conditionEstimatedRepairCosts',
      'conditionEstimatedCleaningCosts',
      'financialsPurchasePrice',
      'financialsTotalRepairAndCleaningCosts',
      'financialsEstimatedShippingCosts',
      'financialsPlatformFees',
      'financialsExpectedProfit',
      'financialsProfitMargin',
      'financialsEstimatedMarketValue',
      'financialsAcquisitionCost',
      'marketAnalysisSuggestedListingPrice',
      'marketAnalysisMinimumAcceptablePrice',
    ];
    numericFields.forEach((field) => {
      if (draftData[field] !== undefined && draftData[field] !== '') {
        draftData[field] = Number(draftData[field]);
      }
    });

    // Ensure images are properly formatted
    if (draftData.images && Array.isArray(draftData.images)) {
      draftData.images = draftData.images.map((image) => ({
        id: image.id,
        url: image.url,
        filename: image.filename,
        isNew: image.isNew,
      }));
    }

    // Prepare the update object
    const updateObject = {
      ...draftData,
      contextData,
      messages,
      lastUpdated: new Date(),
      isDraft: true,
    };

    let draft = await DraftItem.findOneAndUpdate(
      { itemId: draftData.itemId },
      updateObject,
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

router.get('/draft-images/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    console.log(
      `Received request for next sequence number for itemId: ${itemId}`
    );

    const draftItem = await DraftItem.findOne({ itemId });
    if (!draftItem) {
      console.log(`No draft item found for itemId: ${itemId}`);
      return res.status(404).json({ error: 'Draft item not found' });
    }

    const existingImages = draftItem.images || [];
    const nextSequence = existingImages.length + 1;

    console.log(`Next sequence number: ${nextSequence}`);
    res.json({ nextSequentialNumber: nextSequence });
  } catch (error) {
    console.error('Error getting next sequence number:', error);
    res.status(500).json({
      error: 'Failed to get next sequence number',
      details: error.message,
      stack: error.stack,
    });
  }
});

router.get('/draft-images/check/:itemId/:filename', async (req, res) => {
  try {
    const { itemId, filename } = req.params;
    const filePath = path.join(
      __dirname,
      '..',
      'uploads',
      'drafts',
      itemId,
      filename
    );

    await fs.promises.access(filePath, fs.constants.F_OK);
    res.json({ exists: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({ exists: false });
    } else {
      console.error('Error checking file existence:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;

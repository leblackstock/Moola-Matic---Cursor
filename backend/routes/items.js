import express from 'express';
import multer from 'multer';
import { DraftItem } from '../models/DraftItem.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IMAGE_ANALYSIS_PROMPT } from './constants.js';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import fetch from 'node-fetch';
import { generateDraftFilename } from '../../src/components/compSave.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'drafts'));
  },
  filename: function (req, file, cb) {
    // Assuming req.body.itemId is available. If not, you might need to modify this.
    const newFilename = generateDraftFilename(
      req.body.itemId,
      file.originalname
    );
    cb(null, newFilename);
  },
});

const upload = multer({ storage: storage });

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
};

router.post('/save-draft', upload.none(), async (req, res) => {
  console.log('Received request body:', req.body);

  try {
    let draftData = JSON.parse(req.body.draftData);
    console.log('Parsed draftData:', draftData);

    if (!draftData.itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    const updatedDraft = {
      ...draftData,
      lastUpdated: new Date(),
    };

    console.log('Updated draft to be saved:', updatedDraft);

    let savedDraft;
    if (updatedDraft._id) {
      savedDraft = await DraftItem.findByIdAndUpdate(
        updatedDraft._id,
        updatedDraft,
        { new: true }
      );
    } else {
      savedDraft = new DraftItem(updatedDraft);
      await savedDraft.save();
    }

    console.log('Saved draft:', savedDraft);

    res.json({ message: 'Draft saved successfully', item: savedDraft });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'An error occurred while saving the draft' });
  }
});

// Autosave route
router.post('/autosave-draft', upload.array('images'), async (req, res) => {
  console.log('Received autosave request body:', req.body);
  console.log('Received autosave files:', req.files);

  try {
    let draftData = req.body.draftData;
    if (typeof draftData === 'string') {
      try {
        draftData = JSON.parse(draftData);
      } catch (error) {
        console.error('Error parsing draftData:', error);
        return res.status(400).json({ error: 'Invalid draftData format' });
      }
    }
    console.log('Parsed draftData:', draftData);

    // Check if draftData is nested
    if (draftData && draftData.draftData) {
      draftData = draftData.draftData;
    }

    if (!draftData || !draftData.itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    // Handle new image uploads
    const newImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const itemFolder = path.join(
          __dirname,
          '..',
          '..',
          'uploads',
          'drafts',
          draftData.itemId
        );
        console.log('Creating folder:', itemFolder);
        await fs.mkdir(itemFolder, { recursive: true });

        const newFilename = generateDraftFilename(
          draftData.itemId,
          file.originalname
        );
        const newPath = path.join(itemFolder, newFilename);
        console.log('Moving file from', file.path, 'to', newPath);

        try {
          await fs.rename(file.path, newPath);
          console.log('File moved successfully');
        } catch (moveError) {
          console.error('Error moving file:', moveError);
          // If rename fails, try to copy the file instead
          await fs.copyFile(file.path, newPath);
          console.log('File copied successfully');
          await fs.unlink(file.path);
          console.log('Original file deleted');
        }

        newImages.push({
          id: uuidv4(),
          url: `/uploads/drafts/${draftData.itemId}/${newFilename}`,
          filename: newFilename,
          isNew: true,
        });
        console.log('New image added:', newImages[newImages.length - 1]);
      }
    }

    // Merge existing images with new images
    let updatedImages = draftData.images || [];
    if (newImages.length > 0) {
      updatedImages = [...updatedImages, ...newImages];
    }

    const updatedDraft = {
      ...draftData,
      images: updatedImages,
      lastUpdated: new Date(),
    };

    console.log('Updated draft to be autosaved:', updatedDraft);

    let savedDraft = await DraftItem.findOneAndUpdate(
      { itemId: draftData.itemId },
      updatedDraft,
      { new: true, upsert: true }
    );

    console.log('Autosaved draft:', savedDraft);

    res.json({ message: 'Draft autosaved successfully', item: savedDraft });
  } catch (error) {
    console.error('Error autosaving draft:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while autosaving the draft' });
  }
});

router.get('/drafts', async (req, res) => {
  try {
    const drafts = await DraftItem.find({ isDraft: true });

    // Ensure images exist for each draft
    for (const draft of drafts) {
      await ensureImagesExist(draft);
    }

    console.log('Fetched drafts:', drafts);
    res.json(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/drafts/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const draft = await DraftItem.findOne({ itemId: itemId });

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    console.log('Fetched draft:', draft);
    res.json(draft);
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/image-analysis-prompt', (req, res) => {
  res.json({ IMAGE_ANALYSIS_PROMPT });
});

router.get('/items', async (req, res) => {
  try {
    const items = await DraftItem.find({ isDraft: false });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Attempting to delete draft with id:', id);

    // First, try to find the draft by itemId
    let result = await DraftItem.findOneAndDelete({ itemId: id });

    // If not found by itemId, try to find by _id (in case it's a MongoDB ObjectId)
    if (!result) {
      try {
        result = await DraftItem.findByIdAndDelete(id);
      } catch (idError) {
        // If this fails, it's likely because the id is not a valid ObjectId
        console.log('Not a valid ObjectId, continuing with itemId search');
      }
    }

    if (!result) {
      console.log('Draft not found for deletion');
      return res.status(404).json({ message: 'Draft not found' });
    }

    console.log('Draft deleted from database:', result);

    // Delete associated images
    const draftFolder = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'drafts',
      id
    );
    try {
      await deleteFolderRecursive(draftFolder);
      console.log(`Successfully deleted folder: ${draftFolder}`);
    } catch (error) {
      console.error(`Error deleting folder ${draftFolder}:`, error);
      // If the folder doesn't exist, we can ignore the error
      if (error.code !== 'ENOENT') {
        console.warn(`Warning: Could not delete folder ${draftFolder}`);
      }
    }

    res.json({ message: 'Draft and associated files deleted successfully' });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/drafts', async (req, res) => {
  try {
    // Delete all draft documents from the database
    const result = await DraftItem.deleteMany({ isDraft: true });
    console.log('Deleted drafts from database:', result);

    // Delete all files and folders in the drafts upload directory
    const draftsFolder = path.join(__dirname, '..', '..', 'uploads', 'drafts');
    try {
      await deleteFolderRecursive(draftsFolder);
      console.log(`Successfully deleted folder: ${draftsFolder}`);
    } catch (error) {
      console.error(`Error deleting folder ${draftsFolder}:`, error);
      // If the folder doesn't exist, we can ignore the error
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    res.json({
      message: 'All drafts and associated files deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all drafts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add this new route for deleting a single image
router.delete('/draft-image/:itemId/:filename', async (req, res) => {
  try {
    const { itemId, filename } = req.params;
    console.log(`Attempting to delete image: ${filename} for item: ${itemId}`);

    // Find the draft item
    const draft = await DraftItem.findOne({ itemId: itemId });

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    // Remove the image from the draft's images array
    draft.images = draft.images.filter((img) => img.filename !== filename);

    // Save the updated draft
    await draft.save();

    // Delete the image file
    const imagePath = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'drafts',
      itemId,
      filename
    );
    await fs.unlink(imagePath);

    console.log(`Successfully deleted image: ${filename} for item: ${itemId}`);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while deleting the image' });
  }
});

// Helper function to delete folders recursively
async function deleteFolderRecursive(folderPath) {
  try {
    const files = await fs.readdir(folderPath);
    for (const file of files) {
      const curPath = path.join(folderPath, file);
      const stats = await fs.lstat(curPath);
      if (stats.isDirectory()) {
        await deleteFolderRecursive(curPath);
      } else {
        await fs.unlink(curPath);
      }
    }
    await fs.rmdir(folderPath);
  } catch (error) {
    console.error(`Error deleting folder ${folderPath}:`, error);
    // If the folder doesn't exist, we can ignore the error
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

// Add this new route for serving images
router.get('/image/:itemId/:filename', cors(corsOptions), async (req, res) => {
  try {
    const { itemId, filename } = req.params;
    console.log(`Attempting to serve image: ${filename} for item: ${itemId}`);

    const draft = await DraftItem.findOne({ itemId });

    if (!draft) {
      console.log(`Draft not found for itemId: ${itemId}`);
      return res.status(404).send('Draft not found');
    }

    const image = draft.images.find((img) => img.filename === filename);

    if (!image) {
      console.log(`Image not found: ${filename}`);
      return res.status(404).send('Image not found');
    }

    // Construct the full path to the image file
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
      return res.status(404).send('Image file not found');
    }

    // Determine the content type based on the file extension
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

async function ensureImagesExist(draft) {
  if (draft.images && draft.images.length > 0) {
    for (const image of draft.images) {
      const imagePath = path.join(__dirname, '..', '..', image.url);
      try {
        await fs.access(imagePath);
      } catch (error) {
        // Image doesn't exist, try to fetch and save it
        try {
          const response = await fetch(image.url);
          const buffer = await response.buffer();
          await fs.writeFile(imagePath, buffer);
          console.log(`Saved image: ${image.filename}`);
        } catch (fetchError) {
          console.error(
            `Failed to fetch and save image: ${image.filename}`,
            fetchError
          );
        }
      }
    }
  }
}

export default router;

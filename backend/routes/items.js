import express from 'express';
import multer from 'multer';
import { DraftItem } from '../models/DraftItem.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IMAGE_ANALYSIS_PROMPT } from './constants.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'drafts'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

router.post('/save-draft', upload.array('images'), async (req, res) => {
  console.log('Received request body:', req.body);
  console.log('Received files:', req.files);

  try {
    let draftData = req.body;
    if (typeof draftData === 'string') {
      try {
        draftData = JSON.parse(draftData);
      } catch (error) {
        console.error('Error parsing draftData:', error);
        return res.status(400).json({ error: 'Invalid draftData format' });
      }
    }
    console.log('Parsed draftData:', draftData);

    // Handle image uploads
    const newImages = req.files ? req.files.map(file => ({
      id: uuidv4(),
      url: `/uploads/drafts/${file.filename}`,
      filename: file.filename,
      isNew: true
    })) : [];

    // Merge existing images with new images
    let updatedImages = draftData.images || [];
    if (newImages.length > 0) {
      updatedImages = [...updatedImages, ...newImages];
    }

    // Merge existing draft data with new data
    const updatedDraft = {
      ...draftData,
      images: updatedImages,
      lastUpdated: new Date()
    };

    console.log('Updated draft to be saved:', updatedDraft);

    // Save the updated draft
    let savedDraft;
    if (updatedDraft._id) {
      savedDraft = await DraftItem.findByIdAndUpdate(updatedDraft._id, updatedDraft, { new: true });
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

router.get('/drafts', async (req, res) => {
  try {
    const drafts = await DraftItem.find({ isDraft: true });
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

    let result = await DraftItem.findOneAndDelete({ itemId: id });
    if (!result) {
      result = await DraftItem.findByIdAndDelete(id);
    }
    
    if (!result) {
      console.log('Draft not found for deletion');
      return res.status(404).json({ message: 'Draft not found' });
    }

    console.log('Draft deleted:', result);

    // Image deletion logic
    if (result.images && result.images.length > 0) {
      result.images.forEach((image) => {
        if (image.url) {
          const imagePath = image.url.replace('/uploads/', '');
          const fullPath = path.join(__dirname, '..', '..', 'uploads', 'drafts', imagePath);
          fs.unlink(fullPath, (err) => {
            if (err) console.error('Error deleting image:', err);
            else console.log('Deleted image:', fullPath);
          });
        }
      });
    }

    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/drafts', async (req, res) => {
  try {
    const result = await DraftItem.deleteMany({ isDraft: true });
    console.log('Deleted drafts:', result);

    // Delete all images in the drafts folder
    const draftsFolder = path.join(__dirname, '..', '..', 'uploads', 'drafts');
    fs.readdir(draftsFolder, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(draftsFolder, file), (err) => {
          if (err) console.error('Error deleting file:', file, err);
          else console.log('Deleted file:', file);
        });
      }
    });

    res.json({ message: 'All drafts deleted successfully', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting all drafts:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

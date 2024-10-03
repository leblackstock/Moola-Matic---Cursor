import express from 'express';
import multer from 'multer';
import { DraftItem } from '../models/DraftItem.js'; // You'll need to create this model
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IMAGE_ANALYSIS_PROMPT } from './constants.js';  // Adjust the path as necessary
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', '..', 'uploads', 'temp'))
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        cb(null, `temp-${uniqueId}${path.extname(file.originalname)}`)
    }
});

const upload = multer({ storage: storage });

router.post('/save-draft', upload.array('images', 5), async (req, res) => {
    try {
        console.log('Received files:', req.files);
        console.log('Received body:', req.body);

        const draftData = JSON.parse(req.body.draftData);
        console.log('Parsed draftData:', draftData);

        const uniqueId = uuidv4();
        draftData.itemId = draftData.itemId || `draft-${uniqueId}`;

        if (req.files && req.files.length > 0) {
            console.log('Processing files...');
            draftData.images = await Promise.all(req.files.map(async (file) => {
                const oldPath = file.path;
                const newFilename = file.filename.replace('temp-', 'draft-');
                const newPath = path.join(__dirname, '..', '..', 'uploads', 'drafts', newFilename);
                await fs.promises.rename(oldPath, newPath);
                console.log(`Moved file from ${oldPath} to ${newPath}`);
                return `/uploads/drafts/${newFilename}`;
            }));
        } else {
            console.log('No files received');
        }

        console.log('Final draftData to be saved:', draftData);

        const savedDraft = await DraftItem.findOneAndUpdate(
            { itemId: draftData.itemId },
            draftData,
            { upsert: true, new: true }
        );

        console.log('Saved draft:', savedDraft);

        res.status(200).json({ message: 'Draft saved successfully', item: savedDraft });
    } catch (error) {
        console.error('Error saving draft:', error);
        res.status(500).json({ error: 'Failed to save draft', details: error.message });
    }
});

router.get('/drafts', async (req, res) => {
    try {
        const drafts = await DraftItem.find({ isDraft: true });
        console.log('Fetched drafts:', drafts); // Add this line for debugging
        res.json(drafts);
    } catch (error) {
        console.error('Error fetching drafts:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add this new route
router.get('/image-analysis-prompt', (req, res) => {
    res.json({ IMAGE_ANALYSIS_PROMPT });
});

// Add this new route
router.get('/items', async (req, res) => {
    try {
        const items = await DraftItem.find({ isDraft: false });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add this new route at the end of the file
router.delete('/drafts/:id', async (req, res) => {
    try {
        let result = await DraftItem.findOneAndDelete({ itemId: req.params.id });
        if (!result) {
            // If not found by itemId, try to find by _id
            result = await DraftItem.findByIdAndDelete(req.params.id);
        }
        if (!result) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        
        // Delete associated images
        if (result.images && result.images.length > 0) {
            result.images.forEach(imagePath => {
                const fullPath = path.join(__dirname, '..', imagePath);
                fs.unlink(fullPath, (err) => {
                    if (err) console.error('Error deleting image:', err);
                });
            });
        }
        
        res.json({ message: 'Draft deleted successfully' });
    } catch (error) {
        console.error('Error deleting draft:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
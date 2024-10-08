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
        cb(null, path.join(__dirname, '..', '..', 'uploads', 'drafts'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

router.post('/save-draft', upload.array('newImages'), async (req, res) => {
    try {
        console.log('Received save-draft request');
        console.log('Received files:', JSON.stringify(req.files, null, 2));
        console.log('Received body keys:', Object.keys(req.body));
        console.log('Received body:', JSON.stringify(req.body, null, 2));

        let draftData = req.body;
        if (typeof req.body.draftData === 'string') {
            console.log('draftData is a string, parsing...');
            draftData = JSON.parse(req.body.draftData);
        }
        console.log('Parsed draftData:', JSON.stringify(draftData, null, 2));

        const itemId = draftData.itemId || `draft-${uuidv4()}`;
        console.log('Using itemId:', itemId);
        draftData.itemId = itemId;

        // Handle existing images
        let existingImages = draftData.images || [];
        console.log('Initial existingImages:', JSON.stringify(existingImages, null, 2));
        if (typeof existingImages === 'string') {
            console.log('existingImages is a string, parsing...');
            existingImages = JSON.parse(existingImages);
        }
        console.log('Parsed existing images:', JSON.stringify(existingImages, null, 2));

        // Handle new images
        const newImages = [];
        if (req.files && req.files.length > 0) {
            console.log('Processing new files...');
            for (const file of req.files) {
                console.log('Processing file:', file.filename);
                const imageUrl = `/uploads/drafts/${file.filename}`;
                newImages.push({
                    url: imageUrl,
                    filename: file.filename,
                    isNew: true
                });
            }
        }
        console.log('New images:', JSON.stringify(newImages, null, 2));

        // Combine existing and new image data
        draftData.images = [...existingImages, ...newImages];
        console.log('Final draftData images to be saved:', JSON.stringify(draftData.images, null, 2));

        // Remove _id from draftData if it exists
        if (draftData._id) {
            console.log('Removing _id from draftData');
            delete draftData._id;
        }

        console.log('Final draftData to be saved:', JSON.stringify(draftData, null, 2));
        console.log('Attempting to save draft to database...');
        // Save or update the draft in the database
        const savedDraft = await DraftItem.findOneAndUpdate(
            { itemId: itemId },
            { $set: draftData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log('Saved draft:', JSON.stringify(savedDraft, null, 2));

        if (!savedDraft) {
            throw new Error('Failed to save draft to database');
        }

        res.status(200).json({ message: 'Draft saved successfully', item: savedDraft });
    } catch (error) {
        console.error('Error saving draft:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to save draft', details: error.message, stack: error.stack });
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
        let result = await DraftItem.findOneAndDelete({ itemId: req.params.id });
        if (!result) {
            result = await DraftItem.findByIdAndDelete(req.params.id);
        }
        if (!result) {
            return res.status(404).json({ message: 'Draft not found' });
        }
        
        if (result.images && result.images.length > 0) {
            result.images.forEach(imagePath => {
                const fullPath = path.join(__dirname, '..', '..', imagePath);
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
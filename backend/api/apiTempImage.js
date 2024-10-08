// backend/api/apiTempImage.js


import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'temp'))
  },
  filename: function (req, file, cb) {
    cb(null, 'temp-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), async (req, res) => {
  if (req.file) {
    res.json({ 
      tempPath: req.file.path,
      filename: req.file.filename
    });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

export default router;

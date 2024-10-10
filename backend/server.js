import express from 'express';
import cors from 'cors';
// import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import session from 'express-session';
import { fileURLToPath } from 'url';
import chatHandler from './chat/chatHandler.js';
import itemsRouter from './routes/items.js';
import connectDB from './config/database.js';
import MongoStore from 'connect-mongo';
import logger from '../src/helpers/logger.js';

import { handleMoolaMaticChat, manageContext } from './chat/chatService.js';

import tempImageRouter from './api/apiTempImage.js';
import draftImageRouter from './api/apiDraftImage.js';
import purchaseImageRouter from './api/apiPurchaseImage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

const assistantId = process.env.MOOLA_MATIC_ASSISTANT_ID;

if (!assistantId) {
  logger.error('MOOLA_MATIC_ASSISTANT_ID is not defined in the .env file.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

connectDB();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const frontendUrl = `http://localhost:${process.env.FRONTEND_PORT}`;
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    xssFilter: true,
    noSniff: true,
    frameguard: {
      action: 'deny',
    },
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    },
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use('/api/', apiLimiter);

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, '..', 'uploads', 'drafts'));
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(
//       null,
//       file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
//     );
//   },
// });

// const upload = multer({ storage: storage });

app.use('/api', itemsRouter);
app.use('/api/temp-image', tempImageRouter);
app.use('/api/draft-image', draftImageRouter);
app.use('/api/purchase-image', purchaseImageRouter);
app.use('/api', chatHandler);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const contextData = req.session;

  try {
    const managedMessages = await manageContext(messages);
    const assistantResponse = await handleMoolaMaticChat(
      managedMessages,
      contextData
    );
    return res.json({ content: assistantResponse });
  } catch (error) {
    logger.error('Error in /chat:', error);
    return res.status(500).json({
      error: 'Failed to process chat with Moola-Matic. Please try again later.',
    });
  }
});

app.post('/api/logout', (req, res) => {
  const uploadedImages = req.session.uploadedImages || [];

  uploadedImages.forEach((imagePath) => {
    fs.unlink(imagePath, (err) => {
      if (err) {
        logger.error(`Error deleting uploaded image file ${imagePath}:`, err);
      } else {
        logger.debug(`Uploaded image file ${imagePath} deleted successfully.`);
      }
    });
  });

  req.session.destroy((err) => {
    if (err) {
      logger.error('Error destroying session during logout:', err);
      return res
        .status(500)
        .json({ error: 'An error occurred during logout.' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

app.listen(BACKEND_PORT, () => {
  logger.info(`Backend server is running on http://localhost:${BACKEND_PORT}`);
  logger.info(
    `Frontend is expected to run on http://localhost:${FRONTEND_PORT}`
  );
});

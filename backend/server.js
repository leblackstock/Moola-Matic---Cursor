import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { chatHandler } from './chat/chatHandler.js';
import itemsRouter from './routes/items.js';
import tempImageRouter from './api/apiTempImage.js';
import purchaseImageRouter from './api/apiPurchaseImage.js';
import connectDB from './config/database.js';
import MongoStore from 'connect-mongo';
import logger from '../src/helpers/logger.js';
import fsPromises from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;
const frontendUrl = `http://localhost:${FRONTEND_PORT}`;

const assistantId = process.env.MOOLA_MATIC_ASSISTANT_ID;

if (!assistantId) {
  logger.error('MOOLA_MATIC_ASSISTANT_ID is not defined in the .env file.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security with Helmet
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

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days
      autoRemove: 'interval',
      autoRemoveInterval: 10, // In minutes
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    },
  })
);

// Logging incoming requests
app.use((req, res, next) => {
  //console.log(`Received request: ${req.method} ${req.url}`);
  next();
});

// Mount Routers
app.use('/api/items', itemsRouter);
app.use('/api/temp-images', tempImageRouter);
app.use('/api/purchase-images', purchaseImageRouter);
app.use('/api', chatHandler);

// Logout Route
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

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

// 404 Error Handler (move this before startServer)
app.use((req, res, next) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// Improved route logging
console.log('Available routes:');
function print(path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(
      print.bind(null, path.concat(split(layer.route.path)))
    );
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(
      print.bind(null, path.concat(split(layer.regexp)))
    );
  } else if (layer.method) {
    console.log(
      '%s /%s',
      layer.method.toUpperCase(),
      path.concat(split(layer.regexp)).filter(Boolean).join('/')
    );
  }
}

function split(thing) {
  if (typeof thing === 'string') return thing.split('/');
  if (thing.fast_slash) return '';
  var match = thing
    .toString()
    .replace('\\/?', '')
    .replace('(?=\\/|$)', '$')
    .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
  return match
    ? match[1].replace(/\\(.)/g, '$1').split('/')
    : '<complex:' + thing.toString() + '>';
}

app._router.stack.forEach(print.bind(null, []));

const ensureUploadsDirectory = async () => {
  const uploadsPath = path.join(__dirname, 'uploads', 'drafts');
  try {
    await fsPromises.mkdir(uploadsPath, { recursive: true });
    console.log('Uploads directory ensured');
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
};

// Start the Server
const startServer = async () => {
  try {
    await connectDB();
    await ensureUploadsDirectory();
    app.listen(BACKEND_PORT, () => {
      logger.info(
        `Backend server is running on http://localhost:${BACKEND_PORT}`
      );
      logger.info(
        `Frontend is expected to run on http://localhost:${FRONTEND_PORT}`
      );
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

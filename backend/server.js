import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import session from 'express-session';
import { fileURLToPath } from 'url';
import chatHandler from './chat/chatHandler.js';
import itemsRouter from './routes/items.js';
import connectDB from './config/database.js'; // Import the database connection function
import MongoStore from 'connect-mongo';

// Import the assistant module functions
import { handleMoolaMaticChat, manageContext } from './chat/chatService.js';

// Import new routers
import tempImageRouter from './api/apiTempImage.js';
import draftImageRouter from './api/apiDraftImage.js';
import purchaseImageRouter from './api/apiPurchaseImage.js';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Define ports for backend and frontend
const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// Retrieve Assistant ID from .env
const assistantId = process.env.MOOLA_MATIC_ASSISTANT_ID;

if (!assistantId) {
  console.error('MOOLA_MATIC_ASSISTANT_ID is not defined in the .env file.');
  process.exit(1); // Exit the application if MOOLA_MATIC_ASSISTANT_ID is missing
}

// Initialize Express app
const app = express();
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Middleware setup
app.use(express.json()); // Parse JSON bodies

// Enable CORS for all routes
const frontendUrl = `http://localhost:${process.env.FRONTEND_PORT}`;
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Replace the existing Helmet middleware with this more comprehensive configuration
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

// Session setup to manage conversation history and image references

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret', // Use the SESSION_SECRET from .env
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Save uninitialized sessions
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // = 14 days. Default
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      sameSite: 'strict', // Helps protect against CSRF attacks
    },
  })
);

// Rate limiting to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use('/api/', apiLimiter);

// Multer setup for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Unsupported file type. Only JPEG, PNG, WEBP, and GIF are allowed.'
        )
      );
    }
  },
});

// Use the items router with the '/api' prefix
app.use('/api', itemsRouter);

// Use the new image routers
app.use('/api/temp-image', tempImageRouter);
app.use('/api/draft-image', draftImageRouter);
app.use('/api/purchase-image', purchaseImageRouter);

// Use the chatHandler router
app.use('/api', chatHandler);

// Test route to check server status
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

/**
 * Text-Only Chat Endpoint
 * @route POST /api/chat
 * @desc Handles text messages from the frontend and responds using Moola-Matic Assistant
 * @access Public
 */
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const contextData = req.session; // or whatever relevant data you want to pass

  try {
    // Manage context if necessary
    const managedMessages = await manageContext(messages);

    // Interact with the assistant, passing the managed messages and context data
    const assistantResponse = await handleMoolaMaticChat(
      managedMessages,
      contextData
    );

    // Just send the response content
    return res.json({ content: assistantResponse });
  } catch (error) {
    console.error('Error in /chat:', error);
    return res.status(500).json({
      error: 'Failed to process chat with Moola-Matic. Please try again later.',
    });
  }
});

// Use the chatImages router
app.use('/api', chatHandler);

/**
 * Endpoint to handle user logout and clean up uploaded images
 * @route POST /api/logout
 * @desc Logs out the user and deletes any uploaded images associated with their session
 * @access Public
 */
app.post('/api/logout', (req, res) => {
  const uploadedImages = req.session.uploadedImages || [];

  // Delete each uploaded image associated with the session
  uploadedImages.forEach((imagePath) => {
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error(`Error deleting uploaded image file ${imagePath}:`, err);
      } else {
        console.log(`Uploaded image file ${imagePath} deleted successfully.`);
      }
    });
  });

  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session during logout:', err);
      return res
        .status(500)
        .json({ error: 'An error occurred during logout.' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: 'Logged out successfully.' });
  });
});

/**
 * Global Error Handler
 * Catches any unhandled errors and responds with a generic message
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

// Start the server
app.listen(BACKEND_PORT, () => {
  console.log(`Backend server is running on http://localhost:${BACKEND_PORT}`);
  console.log(
    `Frontend is expected to run on http://localhost:${FRONTEND_PORT}`
  );
});

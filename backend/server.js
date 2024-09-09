import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { processChat } from './chatService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());  // Place this after cors and helmet
app.set('trust proxy', 1);
const port = process.env.PORT || 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Enable CORS for all routes
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Add security headers
app.use(helmet());

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', apiLimiter);

// Simple route to test server
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// New route for image upload
// app.post('/api/upload-image', upload.single('image'), async (req, res) => {
//   try {
//     const imageUrl = await handleImageUpload(req.file);
//     res.json({ imageUrl });
//   } catch (error) {
//     console.error('Error uploading image:', error);
//     res.status(500).json({ error: 'Image upload failed' });
//   }
// });

async function analyzeImage(imageFile, contextText) {
  console.log("analyzeImage function called");
  console.log("Image file received:", imageFile);

  if (!imageFile || !(imageFile instanceof Buffer)) {
    console.error("Invalid image file provided. Expected a Buffer object:", imageFile);
    return "Error: Invalid image file provided.";
  }

  let promptText = "Analyze the item in this image comprehensively:\n\n";

  if (contextText && contextText !== "") {
    promptText += `${contextText}\n\n`;
  }

  promptText += "Please provide a detailed analysis of the item in the image by:\n" +
    "1. Identifying what it is and its primary function\n" +
    "2. Noting any historical or cultural significance, including makers, brands, or artists\n" +
    "3. Describing its materials, dimensions, and distinguishing features like markings or signatures\n" +
    "4. Assessing its condition, including damage, wear, restoration, and signs of authenticity such as patina or provenance\n" +
    "5. Evaluating the craftsmanship quality and design features like patterns or styles\n" +
    "6. Estimating its market value based on current trends and its condition\n" +
    "7. If the image contains mathematical content, please analyze or solve it\n" +
    "8. Provide feedback on how this item relates to case interviews, management consulting assessments, or problem-solving scenarios based on the conversation context\n\n" +
    "Ensure your analysis is comprehensive and covers all these aspects.";

  try {
    const base64Image = imageFile.toString('base64');

    console.log("Sending request to OpenAI for image analysis...");
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "auto"
              }
            }
          ]
        }
      ],
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Received response from OpenAI:", JSON.stringify(response.data, null, 2));
    
    if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const imageAnalysis = response.data.choices[0].message.content;
      console.log("Image analysis successful");
      return `The following response is from the image analysis: "${imageAnalysis}". Also return user response as "The image was analyzed, and the following observations were made: ${imageAnalysis}. How would you like to proceed?"`;
    } else {
      console.error("No content in image analysis response");
      return "Error: Unable to analyze the image. No content in response.";
    }
  } catch (error) {
    console.error("Error in image analysis:", error);
    return `Error analyzing image: ${error.message}`;
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    console.log('Received chat request with messages:', messages);

    const response = await processChat(messages);
    console.log('Sending response:', response);

    res.json({ response });
  } catch (error) {
    console.error('Chat request error:', error);
    res.status(500).json({ error: 'An error occurred while processing the chat request' });
  }
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An internal server error occurred' });
});

function startServer(port) {
  app.listen(port, (err) => {
    if (err) {
      console.error('Failed to start server:', err);
    } else {
      console.log(`Server is running on http://localhost:${port}`);
    }
  });
}

startServer(port);

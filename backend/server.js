const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 5000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',  // Your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Simple route to test server
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// New route for image upload
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  console.log('Received upload request');
  console.log('Request file:', req.file);

  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  console.log('File uploaded successfully');
  res.json({ file_id: req.file.filename, url: `http://localhost:5000/uploads/${req.file.filename}` });
});

// API route to handle chat requests
app.post('/api/chat', async (req, res) => {
  const { messages, imageFile } = req.body;

  const handleChatRequest = async (messages, onDataCallback, imageFile) => {
    console.log("handleChatRequest function called");
    console.log("Messages:", messages);

    const safeCallback = typeof onDataCallback === 'function' 
      ? onDataCallback 
      : (content, isComplete) => console.log('Received content:', content, 'Is complete:', isComplete);

    let accumulatedContent = '';

    try {
      let imageFileId = null;

      // Step 1: If there's an image file, upload it first
      if (imageFile instanceof File) {  // Ensure it's a File object
        imageFileId = await handleImageUpload(imageFile);
      }

      // Step 2: Now use the uploaded image URL in the next requests
      const thread = await openai.beta.threads.create();
      console.log("Thread created:", thread.id);

      for (const message of messages) {
        let messageContent = message.content;
        if (imageFileId && message.role === 'user') {
          messageContent.push({
            type: 'image_file',
            image_file: { file_id: imageFileId }
          });
        }

        await openai.beta.threads.messages.create(thread.id, {
          role: message.role,
          content: messageContent
        });
      }

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
        stream: true
      });

      for await (const chunk of run) {
        if (chunk.event === 'thread.message.delta' && chunk.data.delta.content) {
          const content = chunk.data.delta.content[0].text.value;
          accumulatedContent += content;
          safeCallback(content, false);
        }
      }

      safeCallback(accumulatedContent, true);
    } catch (error) {
      console.error('OpenAI API error:', error);
      safeCallback('Sorry, an error occurred. Please try again later.', true);
    }
  };

  const handleImageUpload = async (imageFile) => {
    if (!(imageFile instanceof File)) {
      console.error('Image upload failed: No valid file provided.');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      console.log('Sending image upload request');
      console.log('Image file:', imageFile);
      const response = await axios.post('http://localhost:5000/api/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Image upload response:', response.data);
      return response.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  };

  try {
    await handleChatRequest(messages, (content, isComplete) => {
      if (isComplete) {
        res.json({ content });
      }
    }, imageFile);
  } catch (error) {
    console.error('Error in chat request:', error);
    res.status(500).json({ error: 'An error occurred during the chat request.' });
  }
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

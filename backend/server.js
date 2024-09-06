const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

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

async function handleChatRequest(messages, onDataCallback, imageFile) {
  console.log("handleChatRequest function called");
  console.log("Image file received:", imageFile ? "Yes" : "No");
  console.log("Messages:", messages);

  const safeCallback = typeof onDataCallback === 'function' 
    ? onDataCallback 
    : (content, isComplete) => console.log('Received content:', content, 'Is complete:', isComplete);

  let accumulatedContent = '';

  try {
    let imageAnalysisResult = '';
    if (imageFile) {
      console.log("Image detected, attempting analysis...");
      const contextText = messages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n');
      imageAnalysisResult = await analyzeImage(imageFile, contextText);
      console.log("Image analysis result:", imageAnalysisResult);
    }

    const allMessages = [
      ...messages,
      ...(imageAnalysisResult ? [{ role: 'assistant', content: imageAnalysisResult }] : [])
    ];

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4-turbo",
      messages: allMessages,
      stream: true,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream'
    });

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') {
          safeCallback(accumulatedContent, true);
          return;
        }
        try {
          const parsed = JSON.parse(message);
          const content = parsed.choices[0].delta.content || '';
          accumulatedContent += content;
          safeCallback(content, false);
        } catch (error) {
          console.error('Error parsing stream message:', error);
        }
      }
    });

    response.data.on('end', () => {
      safeCallback(accumulatedContent, true);
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    safeCallback('Sorry, an error occurred. Please try again later.', true);
  }
}

app.post('/api/chat', upload.single('image'), async (req, res) => {
  const { messages } = req.body;
  const imageFile = req.file;

  try {
    let responseContent = '';
    await handleChatRequest(
      JSON.parse(messages),
      (content, isComplete) => {
        responseContent += content;
        if (isComplete) {
          res.json({ content: responseContent });
        }
      },
      imageFile ? imageFile.buffer : null
    );
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

// backend/chatService.js

import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Initialize Assistant if not already created.
 */
let assistantId = null;

const initializeAssistant = async () => {
  if (assistantId) return assistantId;

  const assistant = await openai.beta.assistants.create({
    name: 'Moola-Matic Assistant',
    instructions: 'You are Moola-Matic, an intelligent assistant that manages treasure items. Handle text and image interactions appropriately.',
    tools: [
      { type: 'code_interpreter' }, // Add necessary tools
    ],
    model: 'gpt-4o',
  });

  assistantId = assistant.id;
  console.log('Assistant created with ID:', assistantId);
  return assistantId;
};

/**
 * Function to handle text-only chat with Moola-Matic
 * @param {Array} messages - Array of message objects
 * @returns {String} - Moola-Matic's response content
 */
export const handleChatWithAssistant = async (messages) => {
  try {
    console.log('Processing text-only chat with Moola-Matic:', messages);

    // Create a new thread for each interaction to maintain isolation
    const thread = await openai.beta.threads.create({
      assistant_id: await initializeAssistant(),
    });

    // Add user messages to the thread
    for (const msg of messages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: msg.role,
        content: msg.content,
      });
    }

    // Run the assistant
    const run = openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // Stream the response (optional)
    // You can implement streaming if needed

    const runResult = await run;
    const assistantResponse = runResult.content;

    console.log('Moola-Matic response:', assistantResponse);

    return assistantResponse;
  } catch (error) {
    console.error('Error in handleChatWithAssistant:', error);
    throw error;
  }
};

/**
 * Function to analyze an image with GPT-4 Turbo and pass the response to Moola-Matic
 * @param {Buffer} imageBuffer - Image data buffer
 * @param {Array} messages - Array of message objects
 * @returns {String} - Moola-Matic's response content
 */
export const analyzeImageAndChat = async (imageBuffer, messages) => {
  try {
    console.log('Analyzing image with GPT-4 Turbo');

    // Encode the image to base64
    const base64Image = imageBuffer.toString('base64');

    // Prepare the image content block as per OpenAI's requirements
    const imageContent = {
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`,
        detail: 'auto', // Options: 'low', 'high', 'auto'
      },
    };

    // Prepare messages for GPT-4 Turbo
    const gptMessages = [
      ...messages,
      {
        role: 'user',
        content: 'Please analyze the following image.',
        attachments: [imageContent],
      },
    ];

    // Call GPT-4 Turbo with the updated messages
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: gptMessages,
      max_tokens: 300,
    });

    console.log('GPT-4 Turbo response:', gptResponse);

    const gptContent = gptResponse.choices[0].message.content;

    // Pass GPT-4 Turbo's output to Moola-Matic
    const assistantResponse = await handleChatWithAssistant([
      ...messages,
      { role: 'assistant', content: gptContent },
    ]);

    return assistantResponse;
  } catch (error) {
    console.error('Error in analyzeImageAndChat:', error);
    throw error;
  }
};

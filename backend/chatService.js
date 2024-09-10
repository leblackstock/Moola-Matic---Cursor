import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MOOLA_MATIC_ASSISTANT_ID = process.env.MOOLA_MATIC_ASSISTANT_ID;

export const handleChatRequest = async (messages) => {
  console.log('Handling chat request with messages:', messages);
  try {
    const response = await processChat(messages);
    console.log('Processed chat response:', response);
    return response;
  } catch (error) {
    console.error('Error in handleChatRequest:', error);
    return 'Error processing request.';
  }
};

// This is a placeholder for your actual chat processing logic
const processChat = async (messages) => {
  console.log('Processing chat messages:', messages);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
    });

    console.log('OpenAI API response:', response);
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error processing chat:', error);
    throw error; // Re-throw the error to be caught in handleChatRequest
  }
};

export {
  processChat,
};

// ... any other chat-related functions

export const handleChatWithAssistant = async (messages) => {
  try {
    console.log('Starting handleChatWithAssistant with messages:', messages);

    // Create a new thread for this conversation
    const thread = await openai.beta.threads.create();
    console.log('Created new thread:', thread.id);

    // Add the user's messages to the thread
    for (const message of messages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: message.role,
        content: message.content
      });
    }
    console.log('Added messages to thread');

    // Run the assistant on the thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: MOOLA_MATIC_ASSISTANT_ID
    });
    console.log('Started run:', run.id);

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log('Run status:', runStatus.status);
    }

    // Retrieve the assistant's messages
    const threadMessages = await openai.beta.threads.messages.list(thread.id);
    console.log('Retrieved thread messages');
    
    // Return the last message from the assistant
    const assistantMessage = threadMessages.data
      .filter(message => message.role === 'assistant')
      .pop();

    if (!assistantMessage) {
      throw new Error('No assistant message found in the thread');
    }

    console.log('Returning assistant message');
    return assistantMessage.content[0].text.value;
  } catch (error) {
    console.error('Error in handleChatWithAssistant:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const analyzeImageWithGPT4Turbo = async (imageBase64, messages) => {
  try {
    // Ensure messages is an array of objects
    const formattedMessages = Array.isArray(messages) 
      ? messages 
      : [{ role: "user", content: messages }];

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Update this line
      messages: [
        ...formattedMessages,
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image" },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ],
        },
      ],
      max_tokens: 300,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in analyzeImageWithGPT4Turbo:', error);
    throw error;
  }
};

export const sendMessage = async (message, imageFile = null) => {
  try {
    if (imageFile) {
      const imageBase64 = await convertImageToBase64(imageFile);
      const imageAnalysis = await analyzeImageWithGPT4Turbo(imageBase64, message);
      const assistantResponse = await handleChatWithAssistant([
        { role: "user", content: message },
        { role: "assistant", content: `Image analysis: ${imageAnalysis}` },
      ]);
      return assistantResponse;
    } else {
      return await handleChatWithAssistant([{ role: "user", content: message }]);
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

// ... any other existing code ...

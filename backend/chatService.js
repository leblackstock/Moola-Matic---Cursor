import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

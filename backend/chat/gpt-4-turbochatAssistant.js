// backend/chat/chatAssistant.js

import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const uploadImagesAndGetFileIds = async (batchImages) => {
  try {
    const fileIds = await Promise.all(
      batchImages.map(async (base64) => {
        const file = await openai.files.create({
          file: Buffer.from(base64.split(',')[1], 'base64'),
          purpose: 'vision',
        });
        console.log(`Uploaded file ID: ${file.id}`);
        return file.id;
      })
    );
    return fileIds;
  } catch (error) {
    console.error('Error in uploadImagesAndGetFileIds:', error);
    throw error;
  }
};

const analyzeImagesWithAssistant = async (fileIds, analysisPrompt) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an AI assistant that analyzes images.',
      },
      { role: 'user', content: analysisPrompt },
    ];

    const imageContents = fileIds.map((fileId) => ({
      type: 'image_url',
      image_url: { url: `https://api.openai.com/v1/files/${fileId}/content` },
    }));

    messages[1].content = [
      { type: 'text', text: analysisPrompt },
      ...imageContents,
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages,
      max_tokens: 128000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in analyzeImagesWithAssistant:', error);
    throw error;
  }
};

const createUserMessage = async (threadId, analysisPrompt, fileIds = []) => {
  try {
    return await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: analysisPrompt,
      file_ids: fileIds,
    });
  } catch (error) {
    console.error('Error in createUserMessage:', error);
    throw error;
  }
};

const summarizeAnalyses = async (
  combinedAnalyses,
  combineAndSummarizeAnalysisPrompt
) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that summarizes analyses.',
        },
        {
          role: 'user',
          content: `${combineAndSummarizeAnalysisPrompt}\n\nAnalyses to combine and summarize:\n\n${JSON.stringify(combinedAnalyses, null, 2)}`,
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in summarizeAnalyses:', error);
    throw error;
  }
};

const createAssistantMessage = async (userMessage) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in createAssistantMessage:', error);
    throw error;
  }
};

// Update the exports at the bottom of the file
export {
  uploadImagesAndGetFileIds,
  analyzeImagesWithAssistant,
  createUserMessage,
  summarizeAnalyses,
  createAssistantMessage,
};

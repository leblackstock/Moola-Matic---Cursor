// backend/chat/chatAssistant.js

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const analyzeImagesWithAssistant = async (processedImages, analysisPrompt) => {
  try {
    const thread = await openai.beta.threads.create();

    // Upload images to OpenAI
    const fileIds = await Promise.all(
      processedImages.map(async (base64) => {
        const file = await openai.files.create({
          file: Buffer.from(base64.split(',')[1], 'base64'),
          purpose: 'vision',
        });
        return file.id;
      })
    );

    // Create a message with the prompt and file references
    await createUserMessage(thread.id, analysisPrompt, fileIds);

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.MOOLA_MATIC_ASSISTANT_ID,
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Retrieve the messages
    const messages = await openai.beta.threads.messages.list(thread.id);

    return messages.data[0].content[0].text.value;
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
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `${combineAndSummarizeAnalysisPrompt}\n\nAnalyses to combine and summarize:\n\n${JSON.stringify(combinedAnalyses, null, 2)}`,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.MOOLA_MATIC_ASSISTANT_ID,
    });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    return messages.data[0].content[0].text.value;
  } catch (error) {
    console.error('Error in summarizeAnalyses:', error);
    throw error;
  }
};

/**
 * Creates an assistant message for text-only interactions.
 * @param {string} userMessage - The user's message.
 * @returns {Promise<string>} - The assistant's response.
 */
const createAssistantMessage = async (userMessage) => {
  try {
    const thread = await openai.beta.threads.create();

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userMessage,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.MOOLA_MATIC_ASSISTANT_ID,
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Retrieve the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantResponse = messages.data[0].content[0].text.value;

    return assistantResponse;
  } catch (error) {
    console.error('Error in createAssistantMessage:', error);
    throw error;
  }
};

// Update the exports at the bottom of the file
export {
  analyzeImagesWithAssistant,
  createUserMessage,
  summarizeAnalyses,
  createAssistantMessage,
};

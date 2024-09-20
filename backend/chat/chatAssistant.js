// backend/chat/chatAssistant.js

import express from 'express';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Validate essential environment variables
const { OPENAI_API_KEY, MOOLA_MATIC_ASSISTANT_ID } = process.env;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not defined in the .env file.');
  process.exit(1);
}

if (!MOOLA_MATIC_ASSISTANT_ID) {
  console.error('Error: MOOLA_MATIC_ASSISTANT_ID is not defined in the .env file.');
  process.exit(1);
}

// Initialize OpenAI Client with Assistants API support
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Express Router
const router = express.Router();

// Parse JSON bodies
router.use(bodyParser.json());

/**
 * Function to create a new thread
 * @param {Array} messages - Array of message objects
 * @returns {Promise<String>} - Thread ID
 */
const createThread = async (messages) => {
  try {
    let thread;
    if (messages && messages.length > 0) {
      // Remove the 'source' field from each message
      const cleanedMessages = messages.map(({ role, content }) => ({ role, content }));
      thread = await client.beta.threads.create({
        messages: cleanedMessages,
      });
    } else {
      thread = await client.beta.threads.create();
    }
    console.log('Created thread:', thread);
    return thread.id;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
};

/**
 * Function to add a message to a thread
 * @param {String} threadId - ID of the thread
 * @param {String} role - 'user' or 'assistant'
 * @param {String} content - Message content
 */
const addMessageToThread = async (threadId, role, content) => {
  try {
    await client.beta.threads.messages.create({
      thread_id: threadId,
      role: role === 'user' ? 'user' : 'assistant', // Ensure role is either 'user' or 'assistant'
      content: content,
    });
  } catch (error) {
    console.error('Error adding message to thread:', error);
    throw error;
  }
};

/**
 * Function to create a run
 * @param {String} threadId - ID of the thread
 * @param {String} assistantId - ID of the assistant
 * @returns {Promise<String>} - Run ID
 */
const createRun = async (threadId, assistantId) => {
  try {
    const run = await client.beta.threads.runs.create(
      threadId,
      { assistant_id: assistantId }
    );
    return run.id;
  } catch (error) {
    console.error('Error creating run:', error);
    throw error;
  }
};

/**
 * Function to poll run status until completion
 * @param {String} threadId - ID of the thread
 * @param {String} runId - ID of the run
 * @returns {Promise<Object>} - Run object
 */
const waitForRunCompletion = async (threadId, runId) => {
  try {
    let run = await client.beta.threads.runs.retrieve(
      threadId,
      runId
    );

    while (run.status === 'queued' || run.status === 'in_progress') {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second
      run = await client.beta.threads.runs.retrieve(
        threadId,
        runId
      );
    }

    if (run.status === 'completed') {
      return run;
    } else {
      throw new Error(`Run failed with status: ${run.status}`);
    }
  } catch (error) {
    console.error('Error waiting for run completion:', error);
    throw error;
  }
};

/**
 * Function to get assistant response from a thread
 * @param {String} threadId - ID of the thread
 * @returns {Promise<String>} - Assistant response content
 */
const getAssistantResponse = async (threadId) => {
  try {
    const messages = await client.beta.threads.messages.list(threadId);

    // Find the latest assistant message
    const assistantMessage = messages.data.reverse().find(
      (message) => message.role === 'assistant'
    );

    if (assistantMessage && assistantMessage.content) {
      return assistantMessage.content[0].text.value.trim();
    } else {
      throw new Error('No assistant response found.');
    }
  } catch (error) {
    console.error('Error retrieving assistant response:', error);
    throw error;
  }
};

/**
 * Function to update assistant with tools
 * @param {String} assistantId - ID of the assistant
 * @param {Array} tools - Array of tools
 * @returns {Promise<Object>} - Updated assistant object
 */
const updateAssistantWithTools = async (assistantId, tools) => {
  try {
    const updatedAssistant = await client.beta.assistants.update(assistantId, {
      tools: tools, // Array of tools
    });
    return updatedAssistant;
  } catch (error) {
    console.error('Error updating assistant with tools:', error);
    throw error;
  }
};

/**
 * Function to handle required actions
 * @param {String} threadId - ID of the thread
 * @param {String} runId - ID of the run
 * @param {Object} requiredAction - Required action object
 */
const handleRequiredAction = async (threadId, runId, requiredAction) => {
  try {
    if (requiredAction && requiredAction.submit_tool_outputs) {
      const toolCalls = requiredAction.submit_tool_outputs.tool_calls;

      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          let output;
          // Call your custom function based on functionName
          if (functionName === 'display_quiz') {
            output = displayQuiz(args.title, args.questions);
          }
          // Add more function handlers as needed

          toolOutputs.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify(output),
          });
        }
        // Handle other tool types if necessary
      }

      // Submit tool outputs back to the run
      await client.beta.threads.runs.submit_tool_outputs({
        thread_id: threadId,
        run_id: runId,
        tool_outputs: toolOutputs,
      });
    }
  } catch (error) {
    console.error('Error handling required action:', error);
    throw error;
  }
};

/**
 * Mock function to display a quiz (replace with actual implementation)
 * @param {String} title - Title of the quiz
 * @param {Array} questions - Array of question objects
 * @returns {Array} - User responses
 */
const displayQuiz = (title, questions) => {
  console.log(`Quiz: ${title}\n`);
  const responses = [];

  for (const question of questions) {
    console.log(question.question_text);
    let response = '';

    if (question.question_type === 'MULTIPLE_CHOICE') {
      question.choices.forEach((choice, index) => {
        console.log(`${index}. ${choice}`);
      });
      // Mock user response (replace with actual user input)
      response = '0'; // Example choice
    } else if (question.question_type === 'FREE_RESPONSE') {
      // Mock user response (replace with actual user input)
      response = "I don't know.";
    }

    responses.push(response);
    console.log('');
  }

  return responses;
};

/**
 * Function to retrieve the Moola-Matic assistant
 * @returns {Promise<Object>} - Assistant object
 */
const retrieveMoolaMaticAssistant = async () => {
  try {
    const assistant = await client.beta.assistants.retrieve(MOOLA_MATIC_ASSISTANT_ID);
    console.log('Retrieved Moola-Matic assistant:', assistant);
    return assistant;
  } catch (error) {
    console.error('Error retrieving Moola-Matic assistant:', error);
    throw error;
  }
};

/**
 * Function to interact with the Moola-Matic Assistant API
 * @param {Array} messages - Array of message objects { role: 'user' | 'assistant', content: '...' }
 * @returns {Promise<String>} - Moola-Matic's response content
 */
const interactWithMoolaMaticAssistant = async (messages) => {
  try {
    // Retrieve the Moola-Matic assistant first
    const assistant = await retrieveMoolaMaticAssistant();

    // Step 1: Create a new thread with messages
    const threadId = await createThread(messages);
    console.log('Created thread with ID:', threadId);

    // Step 2: Create a run using the retrieved assistant
    const runId = await createRun(threadId, assistant.id);
    console.log('Created run with ID:', runId);

    // Step 3: Wait for run completion
    let run = await waitForRunCompletion(threadId, runId);

    // Handle required actions if any
    if (run.required_action) {
      await handleRequiredAction(threadId, runId, run.required_action);
      // Wait for the run to complete after submitting tool outputs
      run = await waitForRunCompletion(threadId, runId);
    }

    // Step 4: Retrieve assistant response
    const assistantResponse = await getAssistantResponse(threadId);

    return assistantResponse;
  } catch (error) {
    console.error('Error interacting with Moola-Matic assistant:', error);
    throw new Error('Failed to interact with Moola-Matic Assistant.');
  }
};

/**
 * Route to handle text-only chat interactions
 * POST /api/chat
 * Body: { messages: Array }
 */
router.post('/chat', async (req, res) => {
  const { messages } = req.body;

  // Error handling for invalid message format
  if (!messages || !Array.isArray(messages)) {
    console.error('Invalid messages format received.');
    return res.status(400).json({
      error: 'Invalid messages format. Expected an array of messages.',
    });
  }

  try {
    // Interact with the assistant
    const assistantResponse = await interactWithMoolaMaticAssistant(messages);

    // Optionally, save conversation history here

    return res.json({ content: assistantResponse });
  } catch (error) {
    console.error('Error in /chat:', error);
    return res.status(500).json({
      error: 'Failed to process chat with Moola-Matic. Please try again later.',
    });
  }
});

/**
 * Route to handle image-based chat interactions
 * POST /api/analyze-image
 * This route is intentionally disabled to prevent any image data from being processed or sent.
 */
router.post('/analyze-image', (req, res) => {
  console.error('Attempted to send image data to /api/analyze-image. This operation is not allowed.');
  return res.status(400).json({ error: 'Image processing is not allowed. Only text-based interactions are supported.' });
});

export default router;

// Add this export at the end of the file
export { interactWithMoolaMaticAssistant, retrieveMoolaMaticAssistant };


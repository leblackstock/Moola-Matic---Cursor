// backend/chat/chatCombineAnalysis.js

import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Parses a JSON string and handles any parsing errors.
 * @param {string} jsonString - The JSON string to parse.
 * @returns {Object} - The parsed JSON object or an error object.
 */
const parseJsonResponse = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    return {
      error: 'Failed to parse JSON response',
      rawResponse: jsonString,
    };
  }
};

/**
 * POST /combine-image-analyses
 * Accepts an array of JSON objects representing image analyses,
 * sends them to OpenAI for summarization, and returns the summarized JSON.
 */
router.post('/combine-image-analyses', async (req, res) => {
  try {
    const analyses = req.body;

    if (!Array.isArray(analyses)) {
      return res
        .status(400)
        .json({ error: 'Input should be an array of JSON objects.' });
    }

    // Validate each analysis object
    for (const [index, analysis] of analyses.entries()) {
      if (
        typeof analysis.overall_description !== 'string' ||
        !Array.isArray(analysis.common_objects) ||
        !Array.isArray(analysis.dominant_colors) ||
        typeof analysis.overall_scene !== 'string'
      ) {
        return res.status(400).json({
          error: `Invalid format in analysis object at index ${index}.`,
        });
      }
    }

    // Prepare the prompt for OpenAI
    const prompt = `
You are an AI assistant that summarizes multiple image analyses into a single, cohesive JSON object following this structure:

{
  "overall_description": "A combined description summarizing all the images collectively.",
  "common_objects": ["list", "of", "objects", "frequently", "appearing", "across", "images"],
  "dominant_colors": ["list", "of", "dominant", "colors", "appearing", "frequently", "across", "images"],
  "overall_scene": "A brief description summarizing the common theme or setting across all the images."
}

Here are the individual image analyses:

${JSON.stringify(analyses, null, 2)}

Please summarize the above analyses into a single JSON object following the specified structure.
`;

    // Call OpenAI's API to get the summarized JSON
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    const summarizedContent = aiResponse.choices[0].message.content.trim();

    // Parse the JSON response
    const summarizedJson = parseJsonResponse(summarizedContent);

    // Respond with the summarized JSON
    res.json(summarizedJson);
  } catch (error) {
    console.error('Error in /combine-image-analyses:', error);
    res.status(500).json({
      error: 'An error occurred while processing your request.',
      details: error.message,
    });
  }
});

export default router;
export { parseJsonResponse };

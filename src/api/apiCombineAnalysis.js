// frontend/src/api/apiCombineAnalysis.js

import axios from 'axios';

/**
 * Sends an array of image analysis JSON objects to the backend for summarization.
 * @param {Array} analyses - Array of image analysis JSON objects.
 * @returns {Promise<Object>} - The summarized JSON object.
 */
export const combineImageAnalyses = async (analyses) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/combine-image-analyses`,
      analyses,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // Include cookies if needed
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error combining image analyses:', error);
    throw error;
  }
};

// backend/chat/chatCombineAnalysis.js

export const combineAnalyses = (analysisResults) => {
  try {
    const combinedAnalyses = analysisResults.map((result) => {
      const { parsedJson, remainingText } = parseJsonResponse(result);

      if (!parsedJson) {
        return {
          error: 'Failed to parse JSON response',
          rawResponse: result,
          additionalNotes: remainingText,
        };
      }

      if (Array.isArray(parsedJson)) {
        // Handle case where multiple JSON objects were extracted
        return parsedJson.map((json) => ({
          ...json,
          additionalNotes: remainingText,
        }));
      }

      if (!isValidAnalysis(parsedJson)) {
        return {
          error: 'Invalid analysis structure',
          rawResponse: result,
          additionalNotes: remainingText,
        };
      }

      return {
        ...parsedJson,
        additionalNotes: remainingText,
      };
    });

    return combinedAnalyses.flat();
  } catch (error) {
    console.error('Error in combineAnalyses:', error);
    throw error;
  }
};

/**
 * Attempts to parse JSON from a string, extracting valid JSON objects if possible.
 * @param {string} inputString - The input string that may contain JSON.
 * @returns {Object} - An object containing parsed JSON (if any) and remaining text.
 */
const parseJsonResponse = (inputString) => {
  const result = {
    parsedJson: null,
    remainingText: inputString,
  };

  try {
    // Try to parse the entire string as JSON
    result.parsedJson = JSON.parse(inputString);
    result.remainingText = '';
  } catch (error) {
    // If parsing fails, try to extract JSON objects
    const jsonRegex = /{[^{}]*}|[[^\[\]]*]/g;
    const matches = inputString.match(jsonRegex);

    if (matches) {
      result.parsedJson = matches
        .map((match) => {
          try {
            return JSON.parse(match);
          } catch (e) {
            return null;
          }
        })
        .filter((item) => item !== null);

      // Remove extracted JSON from the remaining text
      result.remainingText = inputString.replace(jsonRegex, '').trim();
    }
  }

  return result;
};

/**
 * Validates the structure of an analysis object.
 * @param {Object} analysis - The analysis object to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
const isValidAnalysis = (analysis) => {
  return (
    typeof analysis.overall_description === 'string' &&
    Array.isArray(analysis.common_objects) &&
    Array.isArray(analysis.dominant_colors) &&
    typeof analysis.overall_scene === 'string'
  );
};

export { parseJsonResponse };

// backend/chat/chatCombineAnalysis.js

const combineAnalyses = (analysisResults) => {
  try {
    // Check if analysisResults is undefined, null, or not an array
    if (!Array.isArray(analysisResults) || analysisResults.length === 0) {
      console.warn('combineAnalyses: Invalid or empty analysisResults');
      return null;
    }

    console.log(
      'Received analysis results:',
      JSON.stringify(analysisResults, null, 2)
    );

    const parsedResults = analysisResults.map(parseJsonResponse);

    console.log('Parsed results:', JSON.stringify(parsedResults, null, 2));

    const combinedAnalysis = parsedResults.reduce((combined, result) => {
      // Check if the current result is a valid object
      if (typeof result !== 'object' || result === null) {
        console.warn('combineAnalyses: Invalid result item', result);
        return combined;
      }

      // Merge the current result with the combined result
      Object.keys(result).forEach((key) => {
        if (
          combined[key] === undefined ||
          combined[key] === null ||
          combined[key] === ''
        ) {
          combined[key] = result[key];
        } else if (key === 'detailedBreakdown') {
          // Concatenate detailed breakdowns
          combined[key] = (combined[key] || '') + '\n' + (result[key] || '');
        }
      });

      return combined;
    }, {});

    console.log(
      'Combined analysis:',
      JSON.stringify(combinedAnalysis, null, 2)
    );

    return combinedAnalysis; // Return the combined analysis directly
  } catch (error) {
    console.error('Error in combineAnalyses:', error);
    return null;
  }
};

/**
 * Attempts to parse JSON from a string, extracting valid JSON objects if possible.
 * @param {string} inputString - The input string that may contain JSON.
 * @returns {Object} - An object containing parsed JSON (if any) and remaining text.
 */
const parseJsonResponse = (input) => {
  if (typeof input === 'object' && input !== null) {
    console.log('parseJsonResponse: Input is already an object', input);
    return input; // Return the input as-is if it's already an object
  }

  if (typeof input !== 'string') {
    console.error('parseJsonResponse: Input is not a string or object', input);
    return { rawAnalysis: JSON.stringify(input) };
  }

  try {
    return JSON.parse(input);
  } catch (error) {
    console.warn('Failed to parse JSON, attempting to extract JSON object');
    const jsonRegex = /{[^{}]*}|[[^\[\]]*]/g;
    const matches = input.match(jsonRegex);

    if (matches) {
      const parsedJson = matches
        .map((match) => {
          try {
            return JSON.parse(match);
          } catch (e) {
            return null;
          }
        })
        .filter((item) => item !== null)[0]; // Take the first valid JSON object

      if (parsedJson) {
        return parsedJson;
      }
    }

    console.warn('No valid JSON found, returning raw analysis');
    return { rawAnalysis: input };
  }
};

/**
 * Validates the structure of an analysis object.
 * @param {Object} analysis - The analysis object to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
const isValidAnalysis = (analysis) => {
  const requiredFields = [
    'name',
    'brand',
    'type',
    'description',
    'category',
    'conditionRating',
    'financialsPurchasePrice',
    'marketAnalysisMarketDemand',
    'purchaseRecommendation',
  ];

  return requiredFields.every((field) => {
    const value = analysis[field];
    return value !== undefined && value !== null && value !== '';
  });
};

export { combineAnalyses, parseJsonResponse, isValidAnalysis };

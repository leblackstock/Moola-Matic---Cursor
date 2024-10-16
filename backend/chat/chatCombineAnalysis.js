// backend/chat/chatCombineAnalysis.js

const combineAnalyses = (analysisResults) => {
  try {
    const combinedAnalysis = analysisResults.reduce((combined, result) => {
      const { parsedJson, remainingText } = parseJsonResponse(result);

      if (!parsedJson) {
        console.error('Failed to parse JSON response', result);
        return combined;
      }

      // Merge the parsed JSON with the combined result
      Object.keys(parsedJson).forEach((key) => {
        if (
          combined[key] === undefined ||
          combined[key] === null ||
          combined[key] === ''
        ) {
          combined[key] = parsedJson[key];
        }
      });

      // Append any remaining text to the detailedBreakdown
      if (remainingText) {
        combined.detailedBreakdown =
          (combined.detailedBreakdown || '') + '\n' + remainingText;
      }

      return combined;
    }, {});

    return isValidAnalysis(combinedAnalysis) ? combinedAnalysis : null;
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
    remainingText: '',
  };

  if (typeof inputString !== 'string') {
    console.error('parseJsonResponse: Input is not a string', inputString);
    result.remainingText = JSON.stringify(inputString);
    return result;
  }

  try {
    result.parsedJson = JSON.parse(inputString);
    result.remainingText = '';
  } catch (error) {
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
        .filter((item) => item !== null)[0]; // Take the first valid JSON object

      result.remainingText = inputString.replace(jsonRegex, '').trim();
    } else {
      result.remainingText = inputString;
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

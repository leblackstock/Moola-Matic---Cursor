// backend/chat/chatCombineAnalysis.js

import winston from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/chatCombineAnalysis.log' }),
  ],
});

/**
 * Parses a single analysis result.
 * @param {string|Object} analysis - The analysis to parse.
 * @returns {Object} - The parsed analysis object.
 */
const parseAnalysis = (analysis) => {
  try {
    logger.info('Starting parseAnalysis function');

    if (typeof analysis === 'object' && analysis !== null) {
      logger.debug('Analysis is already an object', { analysis });
      return analysis;
    }

    const parsed = parseJsonResponse(analysis);
    logger.debug('Parsed analysis:', { parsed });

    if (!isValidAnalysis(parsed)) {
      logger.warn('Invalid analysis structure', { parsed });
      return { rawAnalysis: analysis };
    }

    return parsed;
  } catch (error) {
    logger.error('Error in parseAnalysis', {
      error: error.message,
      stack: error.stack,
    });
    return { rawAnalysis: analysis };
  }
};

const combineAnalyses = (analysisResults) => {
  try {
    logger.info('Starting combineAnalyses function', { analysisResults });

    if (!Array.isArray(analysisResults) || analysisResults.length === 0) {
      logger.warn('Invalid or empty analysisResults', { analysisResults });
      return { combined: false, data: [] };
    }

    logger.debug('Parsing analysis results');
    const parsedResults = analysisResults.map((result, index) => {
      const parsed = parseAnalysis(result);
      logger.debug(`Parsed result ${index}:`, { parsed });
      return parsed;
    });

    // Check if all results are successfully parsed
    const allParsed = parsedResults.every((result) => result.parsed);

    if (!allParsed) {
      logger.info(
        'Not all results are parsed, returning parsed results without combining'
      );
      return { combined: false, data: parsedResults };
    }

    // If all results are parsed, proceed with combination
    logger.debug('All results parsed, combining parsed results');
    const combinedAnalysis = parsedResults.reduce((combined, result) => {
      logger.debug(`Processing result ${index}`, { result });

      if (typeof result !== 'object' || result === null) {
        logger.warn(`Invalid result item at index ${index}`, { result });
        return combined;
      }

      Object.keys(result).forEach((key) => {
        const newValue = result[key];

        if (newValue === null || newValue === 'Unknown') {
          logger.debug(`Skipping null or Unknown value for key: ${key}`);
          return; // Skip this iteration
        }

        if (
          !(key in combined) ||
          combined[key] === null ||
          combined[key] === 'Unknown'
        ) {
          logger.debug(`Setting initial value for key: ${key}`, { newValue });
          combined[key] = newValue;
        } else if (Array.isArray(combined[key])) {
          if (!combined[key].includes(newValue)) {
            logger.debug(`Appending to existing array for key: ${key}`, {
              newValue,
            });
            combined[key].push(newValue);
          }
        } else if (combined[key] !== newValue) {
          logger.debug(`Creating array for key: ${key}`, {
            existingValue: combined[key],
            newValue,
          });
          combined[key] = [combined[key], newValue];
        }
      });

      return combined;
    }, {});

    logger.info('Combined analysis', { combinedAnalysis });
    return { combined: true, data: combinedAnalysis };
  } catch (error) {
    logger.error('Error in combineAnalyses', {
      error: error.message,
      stack: error.stack,
    });
    return { combined: false, data: [] };
  }
};

/**
 * Attempts to parse JSON from a string, extracting valid JSON objects if possible.
 * @param {string} inputString - The input string that may contain JSON.
 * @returns {Object} - An object containing parsed JSON (if any) and remaining text.
 */
const parseJsonResponse = (input) => {
  if (typeof input === 'object' && input !== null) {
    // console.log('parseJsonResponse: Input is already an object', input);
    return input; // Return the input as-is if it's already an object
  }

  if (typeof input !== 'string') {
    // console.error('parseJsonResponse: Input is not a string or object', input);
    return { rawAnalysis: JSON.stringify(input) };
  }

  try {
    return JSON.parse(input);
  } catch (error) {
    // console.warn('Failed to parse JSON, attempting to extract JSON object');
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

    // console.warn('No valid JSON found, returning raw analysis');
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

export { combineAnalyses, parseAnalysis, parseJsonResponse, isValidAnalysis };

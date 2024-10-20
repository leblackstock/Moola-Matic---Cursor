// backend/chat/chatCombineAnalysis.js

import winston from 'winston';
import { DraftItem } from '../models/draftItem';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
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
    logger.info('Parsing Analysis');

    let parsed;
    if (typeof analysis === 'object' && analysis !== null) {
      parsed = analysis;
    } else {
      try {
        parsed = JSON.parse(analysis);
      } catch (error) {
        parsed = { rawAnalysis: analysis };
      }
    }

    // Ensure all fields from DraftItem schema are present
    Object.keys(DraftItem.schema.paths).forEach((field) => {
      if (field !== '_id' && field !== '__v') {
        if (!(field in parsed)) {
          parsed[field] = null;
        }
      }
    });

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
    console.log('Combining Analyses');
    logger.info('Starting combineAnalyses function', { analysisResults });

    if (!Array.isArray(analysisResults) || analysisResults.length === 0) {
      logger.warn('Invalid or empty analysisResults', { analysisResults });
      return { error: 'Invalid or empty analysis results' };
    }

    const parsedResults = analysisResults.map((result) =>
      parseAnalysis(result)
    );

    const allParsed = parsedResults.every((result) => !result.rawAnalysis);
    if (!allParsed) {
      logger.warn('Not all results were successfully parsed');
      return { error: 'Some analyses could not be parsed' };
    }

    const combinedAnalysis = parsedResults.reduce((combined, result) => {
      Object.keys(result).forEach((key) => {
        const newValue = result[key];

        if (newValue === null || newValue === 'Unknown') {
          return; // Skip null or Unknown values
        }

        if (!combined[key]) {
          combined[key] = newValue;
        } else if (Array.isArray(combined[key])) {
          combined[key].push(newValue);
        } else {
          combined[key] = [combined[key], newValue];
        }
      });

      return combined;
    }, {});

    // Handle any additional data that doesn't fit into specific fields
    const detailedBreakdown = parsedResults.reduce((breakdown, result) => {
      const extraData = Object.keys(result).filter(
        (key) => !Object.keys(DraftItem.schema.paths).includes(key)
      );
      extraData.forEach((key) => {
        if (!breakdown[key]) {
          breakdown[key] = result[key];
        } else if (Array.isArray(breakdown[key])) {
          breakdown[key].push(result[key]);
        } else {
          breakdown[key] = [breakdown[key], result[key]];
        }
      });
      return breakdown;
    }, {});

    combinedAnalysis.detailedBreakdown = detailedBreakdown;

    // Ensure all fields from DraftItem schema are present in the final result
    Object.keys(DraftItem.schema.paths).forEach((field) => {
      if (field !== '_id' && field !== '__v') {
        if (!(field in combinedAnalysis)) {
          combinedAnalysis[field] = null;
        }
      }
    });

    logger.info('Combined analysis', { combinedAnalysis });
    return combinedAnalysis;
  } catch (error) {
    logger.error('Error in combineAnalyses', {
      error: error.message,
      stack: error.stack,
    });
    return { error: 'Error combining analyses' };
  }
};

export { combineAnalyses, parseAnalysis };

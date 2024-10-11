// backend/chat/analysisAssistant.js

/**
 * This module defines the analysis prompt used to instruct the GPT assistant.
 * It also includes a function to send multiple base64-encoded images along with
 * a description to the assistant and receive a consolidated JSON response.
 */

import { interactWithMoolaMaticAssistant } from './chatAssistant.js';
import { processImages } from '../utils/imageProcessor.js'; // Ensure this utility is implemented

// Validate essential environment variables
const { OPENAI_API_KEY, MOOLA_MATIC_ASSISTANT_ID } = process.env;

// Define the analysis prompt as a constant
const ANALYSIS_PROMPT = `
You are an expert assistant specialized in evaluating items for resale. Your task is to analyze multiple provided base64-encoded images and a detailed description of the items. Based on your comprehensive analysis, extract and summarize the necessary details into the following JSON format. Ensure that for each specified field, the information is consolidated and concise, reflecting an aggregated understanding derived from all images and the description.

Analysis Objectives

Item Details Type: Determine and state the definitive type of the item, considering all images collectively. Brand: Identify the most prominent brand showcased across the images. Condition: Assess and summarize the overall condition of the item (e.g., "new," "like new," "good," "fair," "poor") based on visual indicators from all images. Rarity: Evaluate and indicate the rarity of the item by synthesizing information from the images. Authenticity Confirmed: Conclude with a clear "Yes" or "No" on the item's authenticity, based on visual evidence and any provided descriptions. Packaging and Accessories: Summarize all packaging materials and accessories visible in any of the images.

Financials Purchase Price: Provide a single, accurate value representing the item's purchase price. Cleaning/Repair Costs: Aggregate and state the total estimated costs for any cleaning or repairs needed. Estimated Shipping Costs: Provide a single, consolidated value for estimated shipping expenses. Platform Fees: Provide a single value representing the fees associated with the resale platform. Expected Profit: Calculate and provide a single value indicating the expected profit from the resale.

Market Analysis Market Demand: Offer a single, clear assessment of the current market demand for the item. Historical Price Trends: Summarize the historical price trends, highlighting any significant patterns or changes. Market Saturation: Provide a single assessment indicating the level of market saturation for similar items. Sales Velocity: Offer a single estimation of how quickly similar items are selling in the market.

Final Recommendation Purchase Recommendation: Conclude with a definitive "Yes" or "No" recommendation on whether to proceed with the purchase. Detailed Breakdown: Provide a concise and comprehensive summary supporting the purchase recommendation, incorporating insights from all analyzed data.

JSON Output Structure

Provide the extracted and consolidated information in the following JSON format:

{ "itemDetails": { "type": "string", "brand": "string", "condition": "string", "rarity": "string", "authenticityConfirmed": "Yes/No", "packagingAccessories": "string" }, "financials": { "purchasePrice": 0, "cleaningRepairCosts": 0, "estimatedShippingCosts": 0, "platformFees": 0, "expectedProfit": 0 }, "marketAnalysis": { "marketDemand": "string", "historicalPriceTrends": "string", "marketSaturation": "string", "salesVelocity": "string" }, "finalRecommendation": { "purchaseRecommendation": "Yes/No", "detailedBreakdown": "string" } }

Notes:

Consolidation:
Ensure that each field contains only one entry, representing an aggregated analysis from all provided images and the description. Avoid repetition of information across fields; instead, synthesize the data to present a unified assessment.

Clarity and Precision:
Use clear and precise language to summarize findings. If certain fields cannot be determined due to lack of information, set them to null to indicate the absence of data.

Consistency:
Maintain a consistent format and structure in the JSON output to facilitate seamless data integration and storage.

Best Practices for Generating Consolidated JSON Responses

Holistic Analysis
Review all images in conjunction with the description to form a comprehensive understanding of the item. Identify overlapping details across images to reinforce accuracy in the consolidated fields.

Prioritize Information
Determine which details are most critical for each field and prioritize their inclusion to maintain conciseness. Eliminate redundant or minor details that do not significantly impact the overall assessment.

Structured Summarization
For fields requiring summarization (e.g., Condition, Rarity), distill the essence of the observations into a single, coherent statement. Use quantitative values (e.g., monetary amounts) where applicable to provide clear and measurable data.

Validation and Consistency Checks
After generating the JSON, perform validation to ensure all required fields are present and correctly formatted. Cross-verify the summarized information against the original images and description to maintain data integrity.

JSON Output Structure

Provide the extracted and consolidated information in the following JSON format:

{
  "itemDetails": {
    "type": "string",
    "brand": "string",
    "condition": "string",
    "rarity": "string",
    "authenticityConfirmed": "Yes/No",
    "packagingAccessories": "string"
  },
  "financials": {
    "purchasePrice": 0,
    "cleaningRepairCosts": 0,
    "estimatedShippingCosts": 0,
    "platformFees": 0,
    "expectedProfit": 0
  },
  "marketAnalysis": {
    "marketDemand": "string",
    "historicalPriceTrends": "string",
    "marketSaturation": "string",
    "salesVelocity": "string"
  },
  "finalRecommendation": {
    "purchaseRecommendation": "Yes/No",
    "detailedBreakdown": "string"
  }
}

`;

/**
 * Sends multiple base64-encoded images and a description to the GPT assistant
 * and retrieves a consolidated JSON response.
 *
 * @param {Array<string>} base64Images - Array of base64-encoded image strings.
 * @param {string} description - Description of the items.
 * @param {string} itemId - Unique identifier for the item.
 * @param {string} [sellerNotes] - Optional seller notes.
 * @param {Object} [contextData] - Optional contextual data.
 * @param {string} [analysisPrompt] - Custom analysis prompt (optional).
 * @returns {Promise<Object>} - The assistant's JSON response.
 */
const sendAnalysisRequest = async (
  base64Images,
  description,
  itemId,
  sellerNotes = '',
  contextData = {}
) => {
  try {
    console.log(`Received ${base64Images.length} images for processing`);

    // Process images and extract relevant information
    const imageAnalysis = await processImages(base64Images);
    console.log(
      'Image analysis results:',
      JSON.stringify(imageAnalysis, null, 2)
    );

    // Count successfully processed images
    const successfulImages = imageAnalysis.filter((img) => !img.error).length;
    const failedImages = imageAnalysis.length - successfulImages;

    const message = {
      role: 'user',
      content: `
Analyze the following item:
Description: ${description || 'No description provided'}
Item ID: ${itemId}
Seller Notes: ${sellerNotes || 'No seller notes provided'}
Image Analysis: ${JSON.stringify(imageAnalysis)}

Note: ${successfulImages} out of ${imageAnalysis.length} images were successfully processed. ${failedImages} images failed to process due to data corruption or invalid formats.

Based on the provided information and image analysis, please fill out the following JSON structure with your best estimates and analysis. If a field cannot be determined, use "Unknown" for string fields and 0 for numeric fields.

Please provide the output in the following JSON format:

{
  "itemDetails": {
    "type": "string",
    "brand": "string",
    "condition": "string",
    "rarity": "string",
    "authenticityConfirmed": "Yes/No",
    "packagingAccessories": "string"
  },
  "financials": {
    "purchasePrice": 0,
    "cleaningRepairCosts": 0,
    "estimatedShippingCosts": 0,
    "platformFees": 0,
    "expectedProfit": 0
  },
  "marketAnalysis": {
    "marketDemand": "string",
    "historicalPriceTrends": "string",
    "marketSaturation": "string",
    "salesVelocity": "string"
  },
  "finalRecommendation": {
    "purchaseRecommendation": "Yes/No",
    "detailedBreakdown": "string"
  }
}

Ensure the output adheres to valid JSON syntax without any comments or additional formatting outside of the given template. Each field should contain aggregated data based on all successfully processed images and provided descriptions, ensuring consistency, clarity, and precision. If some images failed to process, please mention this in your detailed breakdown.
      `,
    };

    console.log(
      'Sending message to assistant:',
      JSON.stringify(message, null, 2)
    );

    const assistantResponse = await interactWithMoolaMaticAssistant(
      [message],
      contextData
    );

    console.log('Raw assistant response:', assistantResponse);

    // The response should already be in JSON format, so we can parse it directly
    try {
      const jsonResponse = JSON.parse(assistantResponse);
      return jsonResponse;
    } catch (parseError) {
      console.warn('Failed to parse JSON from response:', parseError.message);
      return {
        error: 'Failed to parse JSON from assistant response',
        rawResponse: assistantResponse,
      };
    }
  } catch (error) {
    console.error('Error sending analysis request:', error.message);
    throw error;
  }
};

// Example usage
(async () => {
  try {
    // Sample base64-encoded images (truncated for brevity)
    const base64Images = [
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...', // Image 1
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', // Image 2
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...', // Image 3
    ];

    // Sample data
    const description = 'A collection of antique clocks in pristine condition.';
    const itemId = 'unique-item-789';
    const sellerNotes =
      'Includes original boxes and certificates of authenticity.';
    const contextData = {
      lastInteraction: '2024-04-27T10:00:00Z',
    };

    // Send the analysis request
    const result = await sendAnalysisRequest(
      base64Images,
      description,
      itemId,
      sellerNotes,
      contextData,
      ANALYSIS_PROMPT // Explicitly passing the analysis prompt
    );

    console.log('Consolidated JSON Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Analysis failed:', error);
  }
})();

export { sendAnalysisRequest, ANALYSIS_PROMPT };

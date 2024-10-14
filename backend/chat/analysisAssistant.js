// backend/chat/analysisAssistant.js

/**
 * This module defines the analysis prompt used to instruct the GPT assistant.
 * It also includes a function to send multiple base64-encoded images along with
 * a description to the assistant and receive a consolidated JSON response.
 */

/**
 * Sends multiple base64-encoded images and a description to the GPT assistant
 * and retrieves a consolidated JSON response.
 *
 * @param {Array<string>} imagePaths - Array of image file paths.
 * @param {string} description - Description of the items.
 * @param {string} itemId - Unique identifier for the item.
 * @param {string} [sellerNotes] - Optional seller notes.
 * @param {Object} [contextData] - Optional contextual data.
 * @returns {Promise<Object>} - The assistant's JSON response mapped to DraftItem structure.
 */
export const generateAnalysisPrompt = (description, itemId, sellerNotes) => `
Analyze the provided images to fill out the specified JSON structure with detailed information.

# Steps

1. Review each image carefully to gather details about the item.
2. For each attribute in the JSON structure, assess all images to determine the appropriate value.
3. If an attribute cannot be determined or is not applicable, assign it a value of \`null\`.
4. Use additional information such as the description, item ID, and seller notes if provided, to assist in filling out the JSON.

# Output Format

Provide the output strictly in the following JSON format with each field filled out accordingly:

{
  "type": "string",
  "brand": "string",
  "condition": "string",
  "rarity": "string",
  "authenticityConfirmed": "Yes/No",
  "packagingAccessories": "string",
  "purchasePrice": 0,
  "cleaningRepairCosts": 0,
  "estimatedShippingCosts": 0,
  "platformFees": 0,
  "expectedProfit": 0,
  "marketDemand": "string",
  "historicalPriceTrends": "string",
  "marketSaturation": "string",
  "salesVelocity": "string",
  "purchaseRecommendation": "Yes/No",
  "detailedBreakdown": "string"
}

Additional Information:
Description: ${description || 'N/A'}
Item ID: ${itemId || 'N/A'}
Seller Notes: ${sellerNotes || 'N/A'}
`;

export const generateCombineAndSummarizeAnalysisPrompt = () => `
Combine and summarize the provided analysis results into a single, comprehensive JSON structure.

# Steps

1. Review all provided analysis results carefully.
2. For each attribute in the JSON structure, synthesize the information from all analyses to determine the most accurate and comprehensive value.
3. If there are conflicting values for an attribute, use your best judgment to select the most appropriate one or provide a range if applicable.
4. If an attribute is consistently undetermined across all analyses, assign it a value of \`null\`.
5. Compile all additional notes and use them to create a detailed breakdown of the item.

# Output Format

Provide the output strictly in the following JSON format, ensuring each field is filled out with the most comprehensive information:

{
  "type": "string",
  "brand": "string",
  "condition": "string",
  "rarity": "string",
  "authenticityConfirmed": "Yes/No",
  "packagingAccessories": "string",
  "purchasePrice": 0,
  "cleaningRepairCosts": 0,
  "estimatedShippingCosts": 0,
  "platformFees": 0,
  "expectedProfit": 0,
  "marketDemand": "string",
  "historicalPriceTrends": "string",
  "marketSaturation": "string",
  "salesVelocity": "string",
  "purchaseRecommendation": "Yes/No",
  "detailedBreakdown": "string"
}

# Important Notes

1. The "detailedBreakdown" field should be a comprehensive summary that incorporates all additional notes from the individual analyses. This should include any observations, insights, or details that didn't fit into the other structured fields.

2. If there are discrepancies between analyses, mention these in the "detailedBreakdown" and explain how you arrived at the final values in the JSON structure.

3. Ensure that all relevant information from the individual analyses is captured in the final output, either in the structured fields or in the "detailedBreakdown".

4. If any analysis provided unique insights not covered by the standard fields, include this information in the "detailedBreakdown".

5. The final output should represent a complete and nuanced understanding of the item, synthesizing all available information from the multiple analyses.
`;

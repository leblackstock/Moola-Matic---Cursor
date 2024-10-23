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
export const generateAnalysisPrompt = (
  description,
  itemId,
  sellerNotes,
  context,
  analysisDetails
) => {
  // Combine the context instructions with any provided analysis details
  const combinedAnalysisDetails = `
# Context Reliability Instructions
Use the provided context to help identify and analyze images, treating it as highly reliable. Report any strong discrepancies between the provided context and the analysis in a detailed breakdown, focusing on the most relevant conflicts.

- Use the given context to assist in the analysis of the images.
- Treat the context as highly likely to be correct.
- If the analysis reveals strong conflicts with the context:
  - Provide a detailed breakdown of these discrepancies.
  - Highlight the most relevant conflicts.

# Seller's Analysis Details
${analysisDetails || 'No additional details provided.'}
`.trim();

  return `
Analyze the provided images to fill out the specified JSON structure with detailed information.

# Additional Context
${combinedAnalysisDetails}

# Steps

1. Review each image carefully to gather details about the item.
2. For each attribute in the JSON structure, assess all images to determine the appropriate value.
3. If an attribute cannot be determined or is not applicable, assign it a value of \`null\`.
4. Use additional information such as the description, item ID, seller notes, and analysis details if provided, to assist in filling out the JSON.

# Output Format

Provide the output strictly in the following JSON format with each field filled out accordingly:

{
  "name": "string",
  "brand": "string",
  "make": "string",
  "model": "string",
  "serialNumber": "string",
  "type": "string",
  "description": "string",
  "category": "string",
  "subcategory": "string",
  "style": "string",
  "vintage": boolean,
  "antique": boolean,
  "rarity": "string",
  "packagingAccessoriesIncluded": "string",
  "materialComposition": "string",
  "clothingMeasurementsSizeLabel": "string",
  "clothingMeasurementsChestBust": "string",
  "clothingMeasurementsWaist": "string",
  "clothingMeasurementsHips": "string",
  "clothingMeasurementsShoulderWidth": "string",
  "clothingMeasurementsSleeveLength": "string",
  "clothingMeasurementsInseam": "string",
  "clothingMeasurementsTotalLength": "string",
  "footwearMeasurementsSize": "string",
  "footwearMeasurementsWidth": "string",
  "footwearMeasurementsInsoleLength": "string",
  "footwearMeasurementsHeelHeight": "string",
  "footwearMeasurementsPlatformHeight": "string",
  "footwearMeasurementsBootShaftHeight": "string",
  "footwearMeasurementsCalfCircumference": "string",
  "jewelryMeasurementsRingSize": "string",
  "jewelryMeasurementsNecklaceBraceletLength": "string",
  "jewelryMeasurementsPendantDimensions": "string",
  "jewelryMeasurementsJewelryDimensions": "string",
  "furnitureLargeItemMeasurementsHeight": "string",
  "furnitureLargeItemMeasurementsWidth": "string",
  "furnitureLargeItemMeasurementsDepth": "string",
  "furnitureLargeItemMeasurementsLength": "string",
  "furnitureLargeItemMeasurementsSeatHeight": "string",
  "furnitureLargeItemMeasurementsTabletopDimensions": "string",
  "generalMeasurementsWeight": "string",
  "generalMeasurementsDiameter": "string",
  "generalMeasurementsVolumeCapacity": "string",
  "generalMeasurementsOtherSpecificMeasurements": "string",
  "conditionRating": "string",
  "conditionSignsOfWear": "string",
  "conditionDetailedNotes": "string",
  "conditionRepairNeeds": "string",
  "conditionCleaningRequirements": "string",
  "conditionEstimatedRepairCosts": number,
  "conditionEstimatedCleaningCosts": number,
  "conditionTimeSpentOnRepairsCleaning": "string",
  "financialsPurchasePrice": number,
  "financialsTotalRepairAndCleaningCosts": number,
  "financialsEstimatedShippingCosts": number,
  "financialsPlatformFees": number,
  "financialsExpectedProfit": number,
  "financialsProfitMargin": number,
  "financialsEstimatedMarketValue": number,
  "financialsAcquisitionCost": number,
  "marketAnalysisMarketDemand": "string",
  "marketAnalysisHistoricalPriceTrends": "string",
  "marketAnalysisMarketSaturation": "string",
  "marketAnalysisSalesVelocity": "string",
  "marketAnalysisSuggestedListingPrice": number,
  "marketAnalysisMinimumAcceptablePrice": number,
  "itemCareInstructions": "string",
  "keywordsForSeo": "string",
  "lotOrBundleInformation": "string",
  "customizableFields": "string",
  "recommendedSalePlatforms": "string",
  "compliancePlatformPolicies": "string",
  "complianceAuthenticityMarkers": "string",
  "complianceCounterfeitRisk": "string",
  "complianceStatus": "string",
  "complianceRestrictedItemCheck": "string",
  "inventoryDetailsInventoryId": "string",
  "inventoryDetailsStorageLocation": "string",
  "inventoryDetailsAcquisitionDate": "string",
  "inventoryDetailsTargetMarket": "string",
  "inventoryDetailsTrendingItems": "string",
  "inventoryDetailsCustomerPreferences": "string",
  "inventoryDetailsAcquisitionLocation": "string",
  "inventoryDetailsSupplierInformation": "string",
  "purchaseRecommendation": "string",
  "detailedBreakdown": "string",
  "sampleForSaleListing": "string"
}

Additional Information:
Description: ${description || 'N/A'}
Item ID: ${itemId || 'N/A'}
Seller Notes: ${sellerNotes || 'N/A'}
Context: ${context ? JSON.stringify(context) : 'N/A'}

For the "sampleForSaleListing" field, use the following prompt to generate a sample eBay listing:

${listingPrompt}

Ensure that the generated listing adheres to the requirements specified in the prompt and fits within the 1500 character limit.
`;
};

export const generateCombineAndSummarizeAnalysisPrompt = analysisDetails => `
Combine and summarize the provided analysis results into a single, comprehensive JSON structure.

# Additional Context
${
  analysisDetails
    ? `Seller's Analysis Details:
${analysisDetails}

`
    : ''
}
# Steps

1. Review all provided analysis results carefully.
2. For each attribute in the JSON structure, synthesize the information from all analyses to determine the most accurate and comprehensive value.
3. If there are conflicting values for an attribute, use your best judgment to select the most appropriate one or provide a range if applicable.
4. If an attribute is consistently undetermined across all analyses, assign it a value of \`null\`.
5. Compile all additional notes and use them to create a detailed breakdown of the item.

# Output Format

Provide the output strictly in the following JSON format, ensuring each field is filled out with the most comprehensive information:

{
  "name": "string",
  "brand": "string",
  "make": "string",
  "model": "string",
  "serialNumber": "string",
  "type": "string",
  "description": "string",
  "category": "string",
  "subcategory": "string",
  "style": "string",
  "vintage": boolean,
  "antique": boolean,
  "rarity": "string",
  "packagingAccessoriesIncluded": "string",
  "materialComposition": "string",
  "clothingMeasurementsSizeLabel": "string",
  "clothingMeasurementsChestBust": "string",
  "clothingMeasurementsWaist": "string",
  "clothingMeasurementsHips": "string",
  "clothingMeasurementsShoulderWidth": "string",
  "clothingMeasurementsSleeveLength": "string",
  "clothingMeasurementsInseam": "string",
  "clothingMeasurementsTotalLength": "string",
  "footwearMeasurementsSize": "string",
  "footwearMeasurementsWidth": "string",
  "footwearMeasurementsInsoleLength": "string",
  "footwearMeasurementsHeelHeight": "string",
  "footwearMeasurementsPlatformHeight": "string",
  "footwearMeasurementsBootShaftHeight": "string",
  "footwearMeasurementsCalfCircumference": "string",
  "jewelryMeasurementsRingSize": "string",
  "jewelryMeasurementsNecklaceBraceletLength": "string",
  "jewelryMeasurementsPendantDimensions": "string",
  "jewelryMeasurementsJewelryDimensions": "string",
  "furnitureLargeItemMeasurementsHeight": "string",
  "furnitureLargeItemMeasurementsWidth": "string",
  "furnitureLargeItemMeasurementsDepth": "string",
  "furnitureLargeItemMeasurementsLength": "string",
  "furnitureLargeItemMeasurementsSeatHeight": "string",
  "furnitureLargeItemMeasurementsTabletopDimensions": "string",
  "generalMeasurementsWeight": "string",
  "generalMeasurementsDiameter": "string",
  "generalMeasurementsVolumeCapacity": "string",
  "generalMeasurementsOtherSpecificMeasurements": "string",
  "conditionRating": "string",
  "conditionSignsOfWear": "string",
  "conditionDetailedNotes": "string",
  "conditionRepairNeeds": "string",
  "conditionCleaningRequirements": "string",
  "conditionEstimatedRepairCosts": number,
  "conditionEstimatedCleaningCosts": number,
  "conditionTimeSpentOnRepairsCleaning": "string",
  "financialsPurchasePrice": number,
  "financialsTotalRepairAndCleaningCosts": number,
  "financialsEstimatedShippingCosts": number,
  "financialsPlatformFees": number,
  "financialsExpectedProfit": number,
  "financialsProfitMargin": number,
  "financialsEstimatedMarketValue": number,
  "financialsAcquisitionCost": number,
  "marketAnalysisMarketDemand": "string",
  "marketAnalysisHistoricalPriceTrends": "string",
  "marketAnalysisMarketSaturation": "string",
  "marketAnalysisSalesVelocity": "string",
  "marketAnalysisSuggestedListingPrice": number,
  "marketAnalysisMinimumAcceptablePrice": number,
  "itemCareInstructions": "string",
  "keywordsForSeo": "string",
  "lotOrBundleInformation": "string",
  "customizableFields": "string",
  "recommendedSalePlatforms": "string",
  "compliancePlatformPolicies": "string",
  "complianceAuthenticityMarkers": "string",
  "complianceCounterfeitRisk": "string",
  "complianceStatus": "string",
  "complianceRestrictedItemCheck": "string",
  "inventoryDetailsInventoryId": "string",
  "inventoryDetailsStorageLocation": "string",
  "inventoryDetailsAcquisitionDate": "string",
  "inventoryDetailsTargetMarket": "string",
  "inventoryDetailsTrendingItems": "string",
  "inventoryDetailsCustomerPreferences": "string",
  "inventoryDetailsAcquisitionLocation": "string",
  "inventoryDetailsSupplierInformation": "string",
  "purchaseRecommendation": "string",
  "detailedBreakdown": "string",
  "sampleForSaleListing": "string"
}

# Important Notes

1. The "detailedBreakdown" field should be a comprehensive summary that incorporates:
   - All additional notes from the individual analyses
   - The seller's provided analysis details
   - Any observations, insights, or details that didn't fit into the other structured fields
   - Any discrepancies between the provided context and the analysis results

2. Based on all available information, identify the specific item as accurately as possible. Once identified:
   a) Add relevant details about this item to the appropriate fields in the JSON structure, including information that may not be directly observable in the images.
   b) Ensure all confirmed information from the original analyses is retained.
   c) Clearly distinguish between confirmed facts from the analyses and additional information you've inferred or added based on the item identification.

3. In the "detailedBreakdown", include:
   a) A detailed description of the identified item, including its typical uses, history, or any other relevant information not directly observable from the images.
   b) Any notable features, characteristics, or market trends related to this type of item.
   c) A calculation of the maximum amount one should pay to acquire this item to ensure a good profit. Consider the following criteria:
      - Minimum profit: $20
      - Minimum profit margin: 20%
      - Formula: Max Purchase Price = (Estimated Selling Price - Fees - Shipping Costs - $20) / 1.2
   Explain this calculation and provide a recommendation on the maximum purchase price.

4. If there are discrepancies between analyses, mention these in the "detailedBreakdown" and explain how you arrived at the final values in the JSON structure.

5. Ensure that all relevant information from the individual analyses is captured in the final output, either in the structured fields or in the "detailedBreakdown".

6. If any analysis provided unique insights not covered by the standard fields, include this information in the "detailedBreakdown".

7. The final output should represent a complete and nuanced understanding of the item, synthesizing all available information from the multiple analyses and additional research. Clearly differentiate between confirmed facts and inferred or added details.

8. Consider the seller's analysis details when evaluating:
   - Condition assessment
   - Value estimation
   - Market analysis
   - Authentication markers
   - Any specific details mentioned by the seller

9. For the "sampleForSaleListing" field, use the following prompt to generate a sample eBay listing:

${listingPrompt}

Ensure that the generated listing adheres to the requirements specified in the prompt and fits within the 1500 character limit.
`;

export const listingPrompt = `Task: Create an eBay listing for an item with the following components. Ensure each section meets the specified requirements. The entire message must not exceed 1500 characters, including spaces.

eBay Listing Title: Craft a compelling title that maximizes character usage without exceeding 80 characters. Avoid using commas.

Description Title: Write a title for the item description that attracts buyers.

Description: Write a medium-length description to enhance the item's appeal. Include information about the brand and relevant details found online. Do not mention the condition here.

Retail Price: State the current estimated retail price.

Measurements: Convert mm, cm, and m to inches using the nearest 16th fraction. Convert inches and feet to mm, cm, and m using decimals. Convert g and kg to oz and lbs using decimals, and vice versa. Use fractions for metric-to-imperial and decimals for imperial-to-metric. Use standard conversions: 1 inch = 25.4 mm, 1 oz = 28.35 g, 1 lb = 0.4536 kg. Provide both metric and imperial units.

Keywords and Tags: Create a comma-separated list of popular keywords and tags in order of popularity. Each tag must be no longer than 20 characters, including spaces.

End with a call to action that encourages buyers to make a purchase.

Condition: Rewrite the condition to sound appealing and informative. If there is no condition to rewrite, include a used-good condition and make it sound appealing and informative.

Average Selling Price: List the average price this item is selling for on eBay, Etsy, or Poshmark at the end.`;

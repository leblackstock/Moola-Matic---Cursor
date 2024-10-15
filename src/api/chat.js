// frontend/src/api/chat.js

import axios from 'axios';

// Determine the API URL based on the environment
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || 3001;
const API_URL =
  process.env.NODE_ENV === 'production'
    ? '/api'
    : `http://localhost:${BACKEND_PORT}/api`;

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Add this at the top of the file
let contextData = null;

/**
 * Creates a user message object.
 * @param {string} content - The content of the message.
 * @returns {Object} - Message object with role 'user'.
 */
export const createUserMessage = (content) => ({
  role: 'user',
  content,
});

/**
 * Creates an assistant message object.
 * @param {string} content - The content of the message.
 * @returns {Object} - Message object with role 'assistant'.
 */
export const createAssistantMessage = (content) => ({
  role: 'assistant',
  content,
});

/**
 * Function to handle chat with the Moola-Matic Assistant
 * @param {string} message - The message to send to the assistant
 * @param {string} itemId - The ID of the item associated with this chat
 * @returns {Promise<Object>} - Assistant's response content, updated context, and status
 */
export const handleChatWithAssistant = async (message, itemId) => {
  try {
    console.log('Sending message to Moola-Matic:', message);

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, itemId }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log('Received response from server:', data);

    return {
      content: data.message,
      context: data.context,
      itemId: data.itemId,
      status: 'success',
    };
  } catch (error) {
    console.error('Error in handleChatWithAssistant:', error);
    return {
      content:
        'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.',
      context: null,
      itemId: null,
      status: 'error',
    };
  }
};

// Add this function to chat.js
export const handleAnalyzeImages = async ({
  uploadedImages,
  item,
  contextData,
  setItem,
  setMessages,
  setNotificationMessage,
  setShowNotification,
}) => {
  if (uploadedImages.length === 0) {
    setNotificationMessage('Please upload at least one image to analyze.');
    setShowNotification(true);
    return;
  }

  try {
    console.log('Current uploadedImages:', uploadedImages);
    const imageUrls = uploadedImages
      .map((image) => {
        if (image.url) {
          const baseUrl = `http://localhost:${process.env.REACT_APP_BACKEND_PORT}`;
          return image.url.startsWith('http')
            ? image.url
            : `${baseUrl}${image.url}`;
        }
        console.error('No URL for image:', image);
        return null;
      })
      .filter(Boolean);

    console.log('Image URLs for analysis:', imageUrls);

    // Step 1: Get parsed results from the backend
    const response = await fetch(`${API_URL}/analyze-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrls, item, contextData }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const analysisResults = await response.json();

    // Step 2: Map the analysis results to your form fields
    const mappedResult = {
      itemDetails: {
        type: analysisResults.itemDetails?.type || item.itemDetails?.type || '',
        brand:
          analysisResults.itemDetails?.brand || item.itemDetails?.brand || '',
        condition:
          analysisResults.itemDetails?.condition ||
          item.itemDetails?.condition ||
          '',
        rarity:
          analysisResults.itemDetails?.rarity || item.itemDetails?.rarity || '',
        authenticityConfirmed:
          analysisResults.itemDetails?.authenticityConfirmed ??
          item.itemDetails?.authenticityConfirmed ??
          false,
        packagingAccessories:
          analysisResults.itemDetails?.packagingAccessories ||
          item.itemDetails?.packagingAccessories ||
          '',
      },
      financials: {
        purchasePrice:
          analysisResults.financials?.purchasePrice ||
          item.financials?.purchasePrice ||
          0,
        cleaningRepairCosts:
          analysisResults.financials?.cleaningRepairCosts ||
          item.financials?.cleaningRepairCosts ||
          0,
        estimatedShippingCosts:
          analysisResults.financials?.estimatedShippingCosts ||
          item.financials?.estimatedShippingCosts ||
          0,
        platformFees:
          analysisResults.financials?.platformFees ||
          item.financials?.platformFees ||
          0,
        expectedProfit:
          analysisResults.financials?.expectedProfit ||
          item.financials?.expectedProfit ||
          0,
        estimatedValue:
          analysisResults.financials?.estimatedValue ||
          item.financials?.estimatedValue ||
          0,
      },
      marketAnalysis: {
        marketDemand:
          analysisResults.marketAnalysis?.marketDemand ||
          item.marketAnalysis?.marketDemand ||
          '',
        historicalPriceTrends:
          analysisResults.marketAnalysis?.historicalPriceTrends ||
          item.marketAnalysis?.historicalPriceTrends ||
          '',
        marketSaturation:
          analysisResults.marketAnalysis?.marketSaturation ||
          item.marketAnalysis?.marketSaturation ||
          '',
        salesVelocity:
          analysisResults.marketAnalysis?.salesVelocity ||
          item.marketAnalysis?.salesVelocity ||
          '',
      },
      finalRecommendation: {
        purchaseRecommendation:
          analysisResults.finalRecommendation?.purchaseRecommendation ||
          item.finalRecommendation?.purchaseRecommendation ||
          'Unknown',
        detailedBreakdown:
          analysisResults.finalRecommendation?.detailedBreakdown ||
          item.finalRecommendation?.detailedBreakdown ||
          '',
      },
    };

    // Step 3: Update the item state with the mapped results
    setItem((prevItem) => ({
      ...prevItem,
      ...mappedResult,
    }));

    // Step 4: Update messages with the analysis advice
    setMessages((prevMessages) => [
      ...prevMessages,
      createAssistantMessage(
        `Analysis complete. ${mappedResult.finalRecommendation.detailedBreakdown}`
      ),
    ]);

    setNotificationMessage(
      'Image analysis complete. Form fields have been updated.'
    );
    setShowNotification(true);

    return mappedResult;
  } catch (error) {
    console.error('Error in handleAnalyzeImages:', error);
    setNotificationMessage(
      'An error occurred while analyzing the images. Please try again.'
    );
    setShowNotification(true);
    throw error;
  }
};

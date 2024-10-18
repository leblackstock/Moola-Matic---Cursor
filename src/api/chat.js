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
  itemId,
  contextData,
  setItem,
  setMessages,
  setNotificationMessage,
  setShowNotification,
}) => {
  console.log('handleAnalyzeImages called with:', { itemId, contextData });

  if (!itemId) {
    console.error('No itemId provided for image analysis');
    setNotificationMessage('Error: No item ID provided for analysis.');
    setShowNotification(true);
    return;
  }

  try {
    // Step 1: Fetch the item and its image URLs from the database
    const response = await axios.get(`${API_URL}/items/${itemId}`);
    const item = response.data;

    if (!item || !item.images || item.images.length === 0) {
      setNotificationMessage('No images found for this item.');
      setShowNotification(true);
      return;
    }

    console.log('Fetched item:', item);

    // Step 2: Process the image URLs
    const baseUrl = `http://localhost:${process.env.REACT_APP_BACKEND_PORT}`;
    const imageUrls = item.images
      .map((image) => {
        if (image.url) {
          return image.url.startsWith('http')
            ? image.url
            : `${baseUrl}${image.url}`;
        } else if (image.filename) {
          // Construct the URL based on the provided path structure
          return `${baseUrl}/uploads/drafts/${itemId}/${image.filename}`;
        }
        console.error('No URL or filename for image:', image);
        return null;
      })
      .filter(Boolean);

    console.log('Image URLs for analysis:', imageUrls);

    if (imageUrls.length === 0) {
      setNotificationMessage('No valid image URLs found for analysis.');
      setShowNotification(true);
      return;
    }

    // Step 3: Send the image URLs for analysis
    const analysisResponse = await axios.post(`${API_URL}/analyze-images`, {
      imageUrls,
      description: item.description || '',
      itemId,
      sellerNotes: item.sellerNotes || '',
      context: contextData,
    });

    const { analyses, summary, metadata } = analysisResponse.data;

    console.log('Received analysis results:', { analyses, summary, metadata });

    // Step 4: Map the analysis results to your form fields
    const mappedResult = {
      itemDetails: {
        type: summary.itemDetails?.type || item.itemDetails?.type || '',
        brand: summary.itemDetails?.brand || item.itemDetails?.brand || '',
        condition:
          summary.itemDetails?.condition || item.itemDetails?.condition || '',
        rarity: summary.itemDetails?.rarity || item.itemDetails?.rarity || '',
        authenticityConfirmed:
          summary.itemDetails?.authenticityConfirmed ??
          item.itemDetails?.authenticityConfirmed ??
          false,
        packagingAccessories:
          summary.itemDetails?.packagingAccessories ||
          item.itemDetails?.packagingAccessories ||
          '',
      },
      financials: {
        purchasePrice:
          summary.financials?.purchasePrice ||
          item.financials?.purchasePrice ||
          0,
        cleaningRepairCosts:
          summary.financials?.cleaningRepairCosts ||
          item.financials?.cleaningRepairCosts ||
          0,
        estimatedShippingCosts:
          summary.financials?.estimatedShippingCosts ||
          item.financials?.estimatedShippingCosts ||
          0,
        platformFees:
          summary.financials?.platformFees ||
          item.financials?.platformFees ||
          0,
        expectedProfit:
          summary.financials?.expectedProfit ||
          item.financials?.expectedProfit ||
          0,
        estimatedValue:
          summary.financials?.estimatedValue ||
          item.financials?.estimatedValue ||
          0,
      },
      marketAnalysis: {
        marketDemand:
          summary.marketAnalysis?.marketDemand ||
          item.marketAnalysis?.marketDemand ||
          '',
        historicalPriceTrends:
          summary.marketAnalysis?.historicalPriceTrends ||
          item.marketAnalysis?.historicalPriceTrends ||
          '',
        marketSaturation:
          summary.marketAnalysis?.marketSaturation ||
          item.marketAnalysis?.marketSaturation ||
          '',
        salesVelocity:
          summary.marketAnalysis?.salesVelocity ||
          item.marketAnalysis?.salesVelocity ||
          '',
      },
      finalRecommendation: {
        purchaseRecommendation:
          summary.finalRecommendation?.purchaseRecommendation ||
          item.finalRecommendation?.purchaseRecommendation ||
          'Unknown',
        detailedBreakdown:
          summary.finalRecommendation?.detailedBreakdown ||
          item.finalRecommendation?.detailedBreakdown ||
          '',
      },
    };

    // Step 5: Update the item state with the mapped results
    setItem((prevItem) => ({
      ...prevItem,
      ...mappedResult,
    }));

    // Step 6: Update messages with the analysis advice
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

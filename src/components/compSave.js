// frontend\src\components\compSave.js

import axios from 'axios';

// Function to handle draft save
export const handleDraftSave = async (item, messages, currentItemId, backendPort) => {
  if (!currentItemId) {
    console.error("Cannot save draft without a valid item ID");
    return;
  }

  try {
    const formData = new FormData();
    const itemCopy = { ...item };
    delete itemCopy.images; // Remove images from the JSON data
    formData.append('draftData', JSON.stringify({ ...itemCopy, messages, itemId: currentItemId }));

    console.log('Item before saving:', item);
    console.log('Images before saving:', item.images);

    if (item.images && item.images.length > 0) {
      item.images.forEach((image, index) => {
        console.log(`Appending image ${index}:`, image);
        formData.append('images', image);
      });
    } else {
      console.log('No images to append');
    }

    const response = await axios.post(`http://localhost:${backendPort}/api/save-draft`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status !== 200) {
      throw new Error('Failed to save draft');
    }

    const savedDraft = response.data.item;
    console.log('Draft saved successfully:', savedDraft);
    return savedDraft;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

// Function to handle autosave
export const handleAutoSave = async (item, messages, currentItemId, backendPort) => {
  if (!currentItemId) {
    console.error("Cannot auto-save without a valid item ID");
    return;
  }

  try {
    const savedDraft = await handleDraftSave(item, messages, currentItemId, backendPort);
    console.log('Auto-save successful:', savedDraft);
    return savedDraft;
  } catch (error) {
    console.error('Error auto-saving:', error);
    throw error;
  }
};

// Function to handle local save
export const handleLocalSave = (item, contextData, messages) => {
  try {
    localStorage.setItem(`item_${item.itemId}`, JSON.stringify(item));
    localStorage.setItem(`contextData_${item.itemId}`, JSON.stringify(contextData));
    localStorage.setItem(`messages_${item.itemId}`, JSON.stringify(messages));
    console.log('Local save successful');
  } catch (error) {
    console.error('Error saving locally:', error);
    throw error;
  }
};

// Function to load local data
export const loadLocalData = (itemId) => {
  try {
    const item = JSON.parse(localStorage.getItem(`item_${itemId}`));
    const contextData = JSON.parse(localStorage.getItem(`contextData_${itemId}`));
    const messages = JSON.parse(localStorage.getItem(`messages_${itemId}`));
    return { item, contextData, messages };
  } catch (error) {
    console.error('Error loading local data:', error);
    return null;
  }
};

// Function to clear local data
export const clearLocalData = (itemId) => {
  try {
    localStorage.removeItem(`item_${itemId}`);
    localStorage.removeItem(`contextData_${itemId}`);
    localStorage.removeItem(`messages_${itemId}`);
    console.log('Local data cleared successfully');
  } catch (error) {
    console.error('Error clearing local data:', error);
  }
};
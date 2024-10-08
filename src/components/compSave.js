// frontend\src\components\compSave.js

import axios from 'axios';
import { generateItemId } from '../App.js';

// Function to create a default item
export const createDefaultItem = (itemId) => {
  return {
    itemId: itemId,
    name: '',
    brand: '',
    condition: '',
    description: '',
    uniqueFeatures: '',
    accessories: '',
    purchasePrice: '',
    salesTax: '',
    cleaningNeeded: false,
    cleaningTime: '',
    cleaningMaterialsCost: '',
    estimatedValue: '',
    shippingCost: '',
    platformFees: '',
    images: [],
  };
};

// Function to handle new item creation
export const handleNewItem = (setCurrentItemId, setMostRecentItemId, navigate) => {
  const newItemId = generateItemId();
  console.log('handleNewItem: New item created with ID:', newItemId);
  
  const newItem = createDefaultItem(newItemId);
  handleLocalSave(newItem, {}, []); // Save to local storage
  
  navigate(`/new-item/${newItemId}`);
  return newItemId;
};

// Function to handle draft save
export const handleDraftSave = async (item, messages, currentItemId, backendPort) => {
  console.log('handleDraftSave: Saving draft for item with ID:', item.itemId);
  if (!currentItemId) {
    console.error("Cannot save draft without a valid item ID");
    return;
  }

  try {
    const formData = new FormData();
    const itemCopy = { ...item };
    const imagePaths = itemCopy.images.map(img => img.tempPath);
    delete itemCopy.images; // Remove images from the JSON data
    formData.append('draftData', JSON.stringify({ ...itemCopy, messages, itemId: currentItemId, imagePaths }));

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
  console.log('handleLocalSave: Received item:', JSON.stringify(item));
  if (!item || !item.itemId) {
    console.error('handleLocalSave: Item or itemId is undefined', item);
    return; // Exit the function if item or itemId is undefined
  }
  console.log('handleLocalSave: Saving locally for item with ID:', item.itemId);
  
  try {
    // Save the item to local storage
    localStorage.setItem(`item_${item.itemId}`, JSON.stringify(item));
    localStorage.setItem(`contextData_${item.itemId}`, JSON.stringify(contextData || {}));
    localStorage.setItem(`messages_${item.itemId}`, JSON.stringify(messages || []));
    
    console.log('Local save successful');
  } catch (error) {
    console.error('Error during local save:', error);
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
  if (!itemId) {
    console.error('clearLocalData: No itemId provided');
    return;
  }
  localStorage.removeItem(`item_${itemId}`);
  localStorage.removeItem(`contextData_${itemId}`);
  localStorage.removeItem(`messages_${itemId}`);
  console.log(`Local data cleared for item ${itemId}`);
};

// Function to update context data
export const updateContextData = (itemId, newData) => {
  try {
    const prevData = JSON.parse(localStorage.getItem(`contextData_${itemId}`)) || {};
    const updatedData = {
      ...prevData,
      ...newData,
      itemId: itemId
    };
    localStorage.setItem(`contextData_${itemId}`, JSON.stringify(updatedData));
    return updatedData;
  } catch (error) {
    console.error('Error updating context data:', error);
    throw error;
  }
};

// Function to save a draft (for ViewItemsPage)
export const saveDraft = async (item) => {
  const response = await fetch('/api/save-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error('Failed to save draft.');
  return await response.json();
};

// Function to delete a draft
export const deleteDraft = async (id) => {
  const response = await fetch(`/api/drafts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete draft.');
  }
};

// Function to fetch drafts
export const fetchDrafts = async () => {
  try {
    const response = await fetch(`http://localhost:${process.env.REACT_APP_BACKEND_PORT}/api/drafts`);
    const data = await response.json();
    console.log('Drafts fetched from API:', data);
    return data;
  } catch (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
};

// Function to fetch items
export const fetchItems = async () => {
  const response = await fetch('/api/items');
  if (!response.ok) throw new Error('Failed to fetch items.');
  return await response.json();
};

// Function to handle draft save with image processing
export const handleDraftSaveWithImages = async (item, messages, currentItemId, backendPort) => {
  console.log('handleDraftSaveWithImages: Starting save process for item:', item);
  if (!currentItemId) {
    console.error("Cannot save draft without a valid item ID");
    return;
  }

  try {
    const formData = new FormData();
    const itemCopy = { ...item };
    
    console.log('Images before processing:', itemCopy.images);

    // Process images
    if (itemCopy.images && itemCopy.images.length > 0) {
      for (let i = 0; i < itemCopy.images.length; i++) {
        const image = itemCopy.images[i];
        if (image.file) {
          console.log(`Appending image file: ${image.file.name}`);
          formData.append(`images`, image.file, image.file.name);
        } else if (image.url && !image.url.startsWith('blob:')) {
          console.log(`Image already has URL: ${image.url}`);
        } else {
          console.log(`Image at index ${i} has no file or valid URL`);
        }
      }
    } else {
      console.log('No images to process');
    }

    // Remove blob URLs and file objects from the itemCopy
    itemCopy.images = itemCopy.images.filter(img => img.url && !img.url.startsWith('blob:')).map(img => img.url);
    console.log('Prepared image data:', itemCopy.images);

    formData.append('draftData', JSON.stringify({ ...itemCopy, messages, itemId: currentItemId }));

    console.log('FormData prepared, sending to server...');

    const response = await axios.post(`http://localhost:${backendPort}/api/save-draft`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status !== 200) {
      throw new Error('Failed to save draft');
    }

    const savedDraft = response.data.item;
    console.log('Draft saved successfully. Server response:', savedDraft);
    return savedDraft;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};
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
  
  // Clear any existing local storage for this new item
  localStorage.removeItem(`item_${newItemId}`);
  localStorage.removeItem(`contextData_${newItemId}`);
  localStorage.removeItem(`messages_${newItemId}`);
  
  // Save the new empty item to local storage
  handleLocalSave(newItem, {}, []);
  
  setCurrentItemId(newItemId);
  setMostRecentItemId(newItemId);
  
  navigate(`/new-item/${newItemId}`);
  return newItemId;
};

// Function to handle draft save
export const handleDraftSave = async (item, messages, currentItemId, backendPort) => {
  console.log('handleDraftSave: Saving draft for item with ID:', currentItemId);
  if (!currentItemId) {
    console.error("Cannot save draft without a valid item ID");
    return;
  }

  try {
    const formData = new FormData();
    const itemCopy = { ...item };
    
    console.log('Images to be saved:', itemCopy.images);

    // Separate existing images (URLs) and new images (File objects)
    const existingImages = itemCopy.images
      .filter(image => image.url && !image.file)
      .map(image => image.url);

    const newImages = itemCopy.images
      .filter(image => image.file)
      .map(image => image.file);

    console.log('Existing Images:', existingImages);
    console.log('New Images:', newImages);

    // Append existing images
    existingImages.forEach(url => formData.append('existingImages', url));

    // Append new image files
    newImages.forEach(file => formData.append('newImages', file));

    // Include other draft data
    const dataToSend = { ...itemCopy, messages, itemId: currentItemId };
    delete dataToSend.images;  // Exclude images from draftData since handled separately

    formData.append('draftData', JSON.stringify(dataToSend));

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
    console.error('handleDraftSave: Error saving draft:', error);
    throw error;
  }
};

// Function to handle autosave
export const handleAutoSave = async (item, uploadedImages, backendPort, setItem, setUploadedImages, setHasUnsavedChanges, setLastAutoSave, onAutoSaveSuccess, onAutoSaveError) => {
  console.log('Auto-save triggered');
  const currentItem = { ...item };
  console.log('Current item state:', currentItem);

  const formData = new FormData();
  formData.append('draftData', JSON.stringify(currentItem));

  console.log('Images to be saved:', currentItem.images);

  // Append existing images
  formData.append('images', JSON.stringify(currentItem.images));

  // Append new images if any
  uploadedImages.forEach((image, index) => {
    if (image.file) {
      formData.append(`newImages`, image.file);
    }
  });

  console.log('FormData prepared, sending to server...');

  try {
    const response = await axios.post(`http://localhost:${backendPort}/api/save-draft`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Draft saved successfully. Server response:', response.data.item);

    if (response.data.item) {
      setItem(response.data.item);
      setUploadedImages(response.data.item.images || []);
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      onAutoSaveSuccess(response.data.item);
    }
  } catch (error) {
    console.error('Error during auto-save:', error);
    onAutoSaveError(error);
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
    // Save the item to local storage with itemId-specific keys
    localStorage.setItem(`item_${item.itemId}`, JSON.stringify(item));
    localStorage.setItem(`contextData_${item.itemId}`, JSON.stringify(contextData || {}));
    localStorage.setItem(`messages_${item.itemId}`, JSON.stringify(messages || []));
    
    console.log('Local save successful');
  } catch (error) {
    console.error('handleLocalSave: Error saving to localStorage:', error);
  }
};

// Function to load local data based on itemId
export const loadLocalData = (itemId) => {
  const itemString = localStorage.getItem(`item_${itemId}`);
  const contextDataString = localStorage.getItem(`contextData_${itemId}`);
  const messagesString = localStorage.getItem(`messages_${itemId}`);
  
  return {
    item: itemString ? JSON.parse(itemString) : null,
    contextData: contextDataString ? JSON.parse(contextDataString) : {},
    messages: messagesString ? JSON.parse(messagesString) : []
  };
};

// Function to clear local data
export const clearLocalData = () => {
  localStorage.removeItem('currentItem');
  localStorage.removeItem('messages');
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
      itemCopy.images.forEach((image, index) => {
        if (image.file) {
          console.log(`Appending new image file: ${image.file.name}`);
          formData.append(`newImages`, image.file);
          formData.append(`newImageData`, JSON.stringify({
            index,
            tempPath: image.tempPath,
            filename: image.filename
          }));
        } else if (image.url) {
          console.log(`Existing image URL: ${image.url}`);
          formData.append(`existingImages`, image.url);
        }
      });
    } else {
      console.log('No images to process');
    }

    // Send the original images array structure
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

export const saveToLocalStorage = (draft) => {
  localStorage.setItem('currentItem', JSON.stringify({
    ...draft,
    images: draft.images.map(img => ({ url: img })) // Convert image strings to objects with url property
  }));
  if (draft.messages) {
    localStorage.setItem('messages', JSON.stringify(draft.messages));
  }
};

export const handleManualSave = async (item, uploadedImages, backendPort, setItem, setUploadedImages, setHasUnsavedChanges, setLastAutoSave) => {
  console.log("Starting manual save process...");
  console.log("Current item state:", item);

  const existingImages = item.images || [];
  const newImages = uploadedImages.filter(img => img.isNew);

  console.log("Existing images:", existingImages);
  console.log("New images:", newImages);

  const updatedImages = [...existingImages, ...newImages.map(img => ({
    url: img.url,
    filename: img.filename
  }))];

  const updatedItem = {
    ...item,
    images: updatedImages
  };

  console.log("Item data being saved:", updatedItem);

  try {
    console.log("Sending save request to server...");
    const response = await axios.post(`http://localhost:${backendPort}/api/save-draft`, updatedItem);
    console.log("Server response:", response.data);

    if (response.data.item) {
      console.log("Manual save successful:", response.data.item);
      setItem(response.data.item);
      setUploadedImages(response.data.item.images || []);
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      return response.data.item;
    } else {
      console.error("Manual save failed: Unexpected response format");
      throw new Error("Unexpected response format");
    }
  } catch (error) {
    console.error("Error during manual save:", error);
    throw error;
  }
};

export const updateItem = (prevItem, field, value, contextData, messages, handleLocalSave, setHasUnsavedChanges) => {
  if (!prevItem) {
    console.error('updateItem: prevItem is null');
    return null;
  }
  const updatedItem = { ...prevItem, [field]: value };
  console.log('updateItem: Updating item:', updatedItem);
  handleLocalSave(updatedItem, contextData, messages); // Save after each update
  setHasUnsavedChanges(true);
  return updatedItem;
};

// Function to handle file upload
export const handleFileUpload = async (file, backendPort, item) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('itemId', item.itemId);

  try {
    const response = await axios.post(`http://localhost:${backendPort}/api/draft-image/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const currentImageURL = `http://localhost:${backendPort}${response.data.imageUrl}`;

    const newImage = {
      id: Date.now().toString(),
      url: currentImageURL,
      filename: response.data.filename,
      isNew: true
    };

    return { newImage, response };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
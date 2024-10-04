// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import { handleChatWithAssistant, analyzeImageWithGPT4Turbo, createUserMessage, createAssistantMessage } from './api/chat.js';
import axios from 'axios';
import UploadedImagesGallery from './components/UploadedImagesGallery.js';
import PropTypes from 'prop-types';

// Add this function near the top of your file, outside of the NewItemPage component
const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

function NewItemPage({ setMostRecentItemId, currentItemId }) {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(() => createDefaultItem(currentItemId));
  const [messages, setMessages] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const backendPort = process.env.REACT_APP_BACKEND_PORT || 3001;

  useEffect(() => {
    if (itemId !== currentItemId) {
      navigate(`/new-item/${currentItemId}`, { replace: true });
    } else {
      loadItem();
    }
  }, [itemId, currentItemId, navigate]);

  const loadItem = async () => {
    if (currentItemId) {
      setMostRecentItemId(currentItemId);
      try {
        const response = await fetch(`http://localhost:${backendPort}/api/drafts/${currentItemId}`);
        if (response.ok) {
          const draftData = await response.json();
          setItem(draftData);
          setMessages(draftData.messages || []);
        } else if (response.status === 404) {
          const newItem = createDefaultItem(currentItemId);
          setItem(newItem);
        } else {
          throw new Error('Failed to fetch draft');
        }
      } catch (error) {
        console.error('Error loading draft:', error);
        const newItem = createDefaultItem(currentItemId);
        setItem(newItem);
      }
    }
  };

  // Rename this function to avoid naming conflict
  const handleManualSave = async () => {
    if (!currentItemId) {
      console.error("Cannot save draft without a valid item ID");
      return;
    }

    try {
      const response = await fetch(`http://localhost:${backendPort}/api/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...item, messages, itemId: currentItemId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      const savedDraft = await response.json();
      console.log('Draft saved successfully:', savedDraft);
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (item && item.itemId && hasUnsavedChanges) {
        saveDraft();
      }
    }, 30000); // Auto-save every 30 seconds if there are unsaved changes

    return () => clearTimeout(timer);
  }, [item, hasUnsavedChanges]);

  // Function to create a default item
  function createDefaultItem(itemId) {
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
  }

  // Modified updateItem function
  const updateItem = (field, value) => {
    setItem(prevItem => ({
      ...prevItem,
      [field]: value
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contextData, setContextData] = useState(() => {
    const savedContextData = localStorage.getItem(`contextData_${itemId}`);
    return savedContextData ? JSON.parse(savedContextData) : {
      itemId: itemId,
      lastImageAnalysis: null,
      lastAssistantResponse: null,
      lastUserMessage: null,
    };
  });

  // Update the updateContextData function
  const updateContextData = (newData) => {
    setContextData(prevData => {
      const updatedData = {
        ...prevData,
        ...newData,
        itemId: itemId
      };
      localStorage.setItem(`contextData_${itemId}`, JSON.stringify(updatedData));
      return updatedData;
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Your existing submit logic, using `item` instead of `draftItem`
    console.log('Submitting item:', item);
    // Add your submission logic here
  };

  // State for chat messages and AI interaction
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // New state variables for image input and analysis
  const [imageInput, setImageInput] = useState('');
  const [imageAnalysis, setImageAnalysis] = useState(null);

  // New state variable to track whether an image has been analyzed
  const [imageAnalyzed, setImageAnalyzed] = useState(false);

  const [imageAnalysisPrompt, setImageAnalysisPrompt] = useState('');
  const [isPromptLoaded, setIsPromptLoaded] = useState(false);

  // Function to summarize messages to optimize token usage
  const summarizeMessages = async (msgs) => {
    const MAX_MESSAGES = 10; // Define maximum number of messages to keep
    if (msgs.length > MAX_MESSAGES) {
      // Implement summarization by sending the first N messages to Moola-Matic for summarization
      const messagesToSummarize = msgs.slice(0, msgs.length - MAX_MESSAGES);
      const summary = await handleChatWithAssistant([
        ...messagesToSummarize,
        { role: 'user', content: 'Please summarize the above conversation.' }
      ]);

      // Replace the old messages with the summary and the recent messages
      const recentMessages = msgs.slice(-MAX_MESSAGES);
      return [{ role: 'system', content: summary }, ...recentMessages];
    }
    return msgs;
  };

  // Add this function near the top of your component
  const setMessagesAndSave = (newMessages) => {
    setMessages(newMessages);
    // If you want to save messages to localStorage or backend, do it here
    localStorage.setItem(`messages_${currentItemId}`, JSON.stringify(newMessages));
  };

  // Add this function to render message content
  const renderContent = (content) => {
    // You can customize this function based on how you want to render different types of content
    return <div>{content}</div>;
  };

  // Updated sendMessage function
  const sendMessage = async () => {
    const generalInput = message.trim();
    const imageSpecificInput = imageInput.trim();
    
    if (!generalInput && !imageSpecificInput && !imageFile) return;

    setMessage('');
    setImageInput('');
    setIsLoading(true);

    try {
      let response;

      if (imageFile) {
        // Handle image-based messages
        const messageToSend = imageAnalyzed ? imageSpecificInput : imageAnalysisPrompt;
        const result = await analyzeImageWithGPT4Turbo(imageFile, messageToSend, item.itemId);
        response = { content: result.assistantResponse, status: 'completed', contextData: result.contextData };
        
        if (!imageAnalyzed) {
          setImageAnalyzed(true);
        }
      } else {
        // Handle text-only messages
        response = await handleChatWithAssistant([...messages, { role: 'user', content: generalInput }], item.itemId);
      }

      console.log('Assistant response:', response);

      // Update the UI with the new message and response
      setMessagesAndSave(prevMessages => {
        const newMessages = [
          ...prevMessages,
          { role: 'user', content: imageFile ? imageSpecificInput : generalInput },
          { role: 'assistant', content: response.content, source: 'moola-matic', status: response.status }
        ];
        return newMessages;
      });

      // Update contextData
      updateContextData({
        lastAssistantResponse: response.content,
        lastUserMessage: imageFile ? imageSpecificInput : generalInput,
        // ... any other context updates
      });
    } catch (error) {
      console.error('Error interacting with Moola-Matic assistant:', error);
      setMessagesAndSave(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: 'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const messagesContainerRef = useRef(null);

  // Scroll to the bottom of the messages container when messages update
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Handle image button click to show modal
  const handleImageButtonClick = () => {
    setShowImageModal(true);
  };

  // Handle camera input
  const handleCameraClick = () => {
    cameraInputRef.current.click();
    setShowImageModal(false);
  };

  // Handle media input
  const handleMediaClick = () => {
    fileInputRef.current.click();
    setShowImageModal(false);
  };

  // Handle file selection
  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const image = files[0];
      setImageFile(image);
      setImageAnalyzed(false);

      const imagePreviewUrl = URL.createObjectURL(image);
      setImagePreview(imagePreviewUrl);

      // Safely update the item.images array
      setItem(prevItem => ({
        ...prevItem,
        images: Array.isArray(prevItem.images) ? [...prevItem.images, image] : [image]
      }));

      // Immediately analyze the image
      setIsLoading(true);
      try {
        const assistantResponse = await analyzeImageWithGPT4Turbo(image, imageAnalysisPrompt);
        setMessages(prevMessages => [
          ...prevMessages,
          { role: 'user', content: 'Image uploaded', image: imagePreviewUrl },
          { role: 'assistant', content: assistantResponse }
        ]);
        setImageAnalyzed(true);
      } catch (error) {
        console.error('Error analyzing image:', error);
        setMessages(prevMessages => [
          ...prevMessages,
          { role: 'user', content: 'Image upload failed', image: imagePreviewUrl },
          { role: 'assistant', content: 'Sorry, an error occurred while analyzing the image. Please try again.' }
        ]);
      }
      setIsLoading(false);

      const newImage = {
        url: imagePreviewUrl,
        base64: await getBase64(image),
        file: image
      };

      setUploadedImages(prevImages => [...prevImages, newImage]);
    }
  };

  useEffect(() => {
    const fetchImageAnalysisPrompt = async () => {
      try {
        const response = await fetch('/api/image-analysis-prompt');
        if (!response.ok) {
          throw new Error('Failed to fetch IMAGE_ANALYSIS_PROMPT');
        }
        const data = await response.json();
        setImageAnalysisPrompt(data.IMAGE_ANALYSIS_PROMPT);
        setIsPromptLoaded(true);
      } catch (error) {
        console.error('Error fetching IMAGE_ANALYSIS_PROMPT:', error);
        // Optionally, set some error state here
      }
    };

    fetchImageAnalysisPrompt();
  }, []);

  // When you need to use the prompt:
  const analyzeImage = async (file) => {
    // ... other code ...
    const response = await analyzeImageWithGPT4Turbo(file, imageAnalysisPrompt);
    // ... other code ...
  };

  const analyzeImageWithGPT4Turbo = async (file, message, isInitialAnalysis = true) => {
    // Convert the file to base64
    const base64Image = await fileToBase64(file);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('base64Image', base64Image);  // Add base64 image
    formData.append('message', isInitialAnalysis ? imageAnalysisPrompt : message);
    formData.append('isInitialAnalysis', isInitialAnalysis);
    formData.append('itemId', itemId);
    formData.append('contextData', JSON.stringify(contextData));

    try {
      const response = await fetch(`http://localhost:${backendPort}/api/analyze-image`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      // Update your local contextData with the response
      setContextData(prevContextData => ({
        ...prevContextData,
        ...data.contextData
      }));
      return data.advice;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const sendImageMessage = async () => {
    if (!imageFile || !imageInput.trim()) return;

    const newMessage = {
      content: imageInput.trim(),
      role: 'user',
      image: imagePreview,
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setIsLoading(true);

    try {
      const assistantResponse = await analyzeImageWithGPT4Turbo(imageFile, imageInput.trim(), false);
      
      setMessagesAndSave(prevMessages => [
        ...prevMessages,
        { role: 'user', content: imageInput.trim(), image: imagePreview },
        { role: 'assistant', content: assistantResponse },
      ]);
    } catch (error) {
      console.error('Error in sendImageMessage:', error);
      setMessagesAndSave(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      setImageFile(null);
      setImagePreview('');
      setImageInput('');
    }
  };

  // Add this new state variable for the notification
  const [showNotification, setShowNotification] = useState(false);

  // Update the saveAsDraft function
  const saveAsDraft = async () => {
    try {
      const formData = new FormData();
      const itemCopy = { ...item };
      delete itemCopy.images; // Remove images from the JSON data
      formData.append('draftData', JSON.stringify(itemCopy));

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

      const response = await axios.post('/api/save-draft', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status !== 200) {
        throw new Error('Failed to save draft');
      }

      const savedDraft = response.data.item;
      console.log('Draft saved successfully:', savedDraft);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);

      if (response.status === 200) {
        // Clear localStorage after successful save
        localStorage.removeItem(`item_${item.itemId}`);
        localStorage.removeItem(`contextData_${item.itemId}`);
        localStorage.removeItem(`messages_${item.itemId}`);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      // Optionally, you can show an error message to the user here
    }
  };

  // Add this CSS animation
  const fadeInOutAnimation = `
    @keyframes fadeInOut {
      0% { opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;

  useEffect(() => {
    if (item) {
      localStorage.setItem(`item_${item.itemId}`, JSON.stringify(item));
      localStorage.setItem(`contextData_${item.itemId}`, JSON.stringify(contextData));
      localStorage.setItem(`messages_${item.itemId}`, JSON.stringify(messages));
    }
  }, [item, contextData, messages]);

  useEffect(() => {
    if (item) {
      return () => {
        localStorage.removeItem(`item_${item.itemId}`);
        localStorage.removeItem(`contextData_${item.itemId}`);
        localStorage.removeItem(`messages_${item.itemId}`);
      };
    }
  }, [item]);

  const saveDraft = () => {
    if (!item || !item.itemId) {
      console.error("Cannot save draft without an item ID");
      // Maybe show an error message to the user
      return;
    }
    
    // Proceed with saving
    localStorage.setItem(`item_${item.itemId}`, JSON.stringify(item));
    // If you're also saving to a backend, make the API call here
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (item && item.itemId && hasUnsavedChanges) {
        saveDraft();
      }
    }, 30000); // Auto-save every 30 seconds if there are unsaved changes

    return () => clearTimeout(timer);
  }, [item, hasUnsavedChanges]);

  // Add this useEffect for debugging
  useEffect(() => {
    console.log("Current item state:", item);
  }, [item]);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Add this function to handle image selection from the gallery
  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setImagePreview(image.preview);
    setImageFile(image.file);
    setImageAnalyzed(false);
  };

  useEffect(() => {
    // Load draft if itemID exists
    if (itemId) {
      const savedItem = localStorage.getItem(`item_${itemId}`);
      if (savedItem) {
        setItem(JSON.parse(savedItem));
      }
    }
  }, [itemId]);

  return (
    <div className="container">
      {showNotification && (
        <div className="notification">
          Item successfully saved as draft
        </div>
      )}

      {/* Header and introduction */}
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <img 
            src={treasureSpecs} 
            alt="Treasure Specs" 
            className="img-fluid mb-4 accent-element page-image" 
          />
          <h2 className="mb-3">Add Your Thrifty Find</h2>
          <p className="mb-4">Ready to turn that rusty gold into shiny cash? Let's get started!</p>
        </div>
      </div>
      
      {/* AI Chat Box */}
      <div className="ai-chat-box mb-5">
        <h3 className="text-center mb-4">Moola-Matic Wizard</h3>
        <div className="messages" ref={messagesContainerRef}>
          <div ref={chatContainerRef} className="chat-history">
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <div key={index} className={`message-container ${message.role === 'user' ? 'user' : 'assistant'}`}>
                  <div className="message-bubble">
                    {message.role === 'assistant' ? renderContent(message.content) : message.content}
                  </div>
                </div>
              ))
            ) : (
              <p>No chat history available.</p>
            )}
          </div>
          {isLoading && <div className="ai-typing">AI is typing...</div>}
        </div>

        {/* Image Input Box (conditionally rendered) */}
        {imageFile && (
          <div className="image-input-container">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <textarea
              className="chat-input"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendImageMessage();
                }
              }}
              placeholder="Ask a question about the image..."
              rows="1"
            />
            <button className="icon-button" onClick={sendImageMessage} disabled={isLoading}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        )}

        {/* Original Text Input Box */}
        <div className="input-container">
          <i className="fas fa-comment text-icon"></i>
          <textarea
            className="chat-input"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message here..."
            rows="1"
            style={{display: 'flex', alignItems: 'center'}}
          />
          <button className="icon-button" onClick={sendMessage} disabled={isLoading}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {/* Add Images Button */}
      <div className="mb-4 text-center">
        <button 
          className="btn btn-primary-theme" 
          onClick={() => fileInputRef.current.click()}
          disabled={!isPromptLoaded || isLoading}
        >
          <i className="fas fa-image me-2"></i>Add Images
        </button>
      </div>

      <UploadedImagesGallery
        images={uploadedImages}
        onSelect={handleImageSelect}
        selectedImage={selectedImage}
      />

      {/* Image Selection Modal */}
      {showImageModal && (
        <div className="select-box-overlay" onClick={() => setShowImageModal(false)}>
          <div className="select-box" onClick={(e) => e.stopPropagation()}>
            <h2>Add Images</h2>
            <p>Choose how you'd like to add images:</p>
            <div className="select-box-buttons">
              <button className="select-box-button select-box-primary" onClick={handleCameraClick}>
                <i className="fas fa-camera me-2"></i>Camera
              </button>
              <button className="select-box-button select-box-secondary" onClick={handleMediaClick}>
                <i className="fas fa-folder-open me-2"></i>Media
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Item Details Form */}
      <form onSubmit={handleSubmit}>
        {/* Basic Item Information */}
        <div className="mb-3">
          <label htmlFor="itemName" className="form-label">Item Name</label>
          <input 
            type="text" 
            className="form-control" 
            id="itemName" 
            value={item?.name || ''} 
            onChange={(e) => updateItem('name', e.target.value)} 
            required 
          />
        </div>

        <div className="mb-3">
          <label htmlFor="brand" className="form-label">Brand</label>
          <input 
            type="text" 
            className="form-control" 
            id="brand" 
            value={item?.brand || ''} 
            onChange={(e) => updateItem('brand', e.target.value)} 
          />
        </div>

        <div className="mb-3">
          <label htmlFor="condition" className="form-label">Condition</label>
          <select 
            className="form-select" 
            id="condition" 
            value={item?.condition || ''} 
            onChange={(e) => updateItem('condition', e.target.value)} 
            required 
          >
            <option value="">Select condition</option>
            <option value="new">New</option>
            <option value="like-new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        {/* Detailed Item Information */}
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea 
            className="form-control" 
            id="description" 
            rows="3" 
            value={item?.description || ''} 
            onChange={(e) => updateItem('description', e.target.value)} 
          ></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="uniqueFeatures" className="form-label">Unique Features</label>
          <input 
            type="text" 
            className="form-control" 
            id="uniqueFeatures" 
            value={item?.uniqueFeatures || ''} 
            onChange={(e) => updateItem('uniqueFeatures', e.target.value)} 
          />
        </div>

        <div className="mb-3">
          <label htmlFor="accessories" className="form-label">Accessories</label>
          <input 
            type="text" 
            className="form-control" 
            id="accessories" 
            value={item?.accessories || ''} 
            onChange={(e) => updateItem('accessories', e.target.value)} 
          />
        </div>

        {/* Purchase Information */}
        <div className="mb-3">
          <label htmlFor="purchasePrice" className="form-label">Purchase Price</label>
          <input 
            type="number" 
            className="form-control" 
            id="purchasePrice" 
            value={item?.purchasePrice || ''} 
            onChange={(e) => updateItem('purchasePrice', e.target.value ? parseFloat(e.target.value) : '')} 
            required 
          />
        </div>

        <div className="mb-3">
          <label htmlFor="salesTax" className="form-label">Sales Tax</label>
          <input 
            type="number" 
            className="form-control" 
            id="salesTax" 
            value={item?.salesTax || ''} 
            onChange={(e) => updateItem('salesTax', e.target.value ? parseFloat(e.target.value) : '')} 
          />
        </div>

        {/* Repair and Cleaning */}
        <div className="mb-3">
          <label htmlFor="cleaningNeeded" className="form-label">Cleaning Needed?</label>
          <select 
            className="form-select" 
            id="cleaningNeeded" 
            value={item?.cleaningNeeded || false} 
            onChange={(e) => updateItem('cleaningNeeded', e.target.value === 'true')} 
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        {item?.cleaningNeeded && (
          <>
            <div className="mb-3">
              <label htmlFor="cleaningTime" className="form-label">Cleaning Time (hours)</label>
              <input 
                type="number" 
                className="form-control" 
                id="cleaningTime" 
                value={item?.cleaningTime || ''} 
                onChange={(e) => updateItem('cleaningTime', e.target.value ? parseFloat(e.target.value) : '')} 
              />
            </div>
            <div className="mb-3">
              <label htmlFor="cleaningMaterialsCost" className="form-label">Cleaning Materials Cost</label>
              <input 
                type="number" 
                className="form-control" 
                id="cleaningMaterialsCost" 
                value={item?.cleaningMaterialsCost || ''} 
                onChange={(e) => updateItem('cleaningMaterialsCost', e.target.value ? parseFloat(e.target.value) : '')} 
              />
            </div>
          </>
        )}

        {/* Resale Information */}
        <div className="mb-3">
          <label htmlFor="estimatedValue" className="form-label">Estimated Resale Value</label>
          <input 
            type="number" 
            className="form-control" 
            id="estimatedValue" 
            value={item?.estimatedValue || ''} 
            onChange={(e) => updateItem('estimatedValue', e.target.value ? parseFloat(e.target.value) : '')} 
            required 
          />
        </div>

        <div className="mb-3">
          <label htmlFor="shippingCost" className="form-label">Estimated Shipping Cost</label>
          <input 
            type="number" 
            className="form-control" 
            id="shippingCost" 
            value={item?.shippingCost || ''} 
            onChange={(e) => updateItem('shippingCost', e.target.value ? parseFloat(e.target.value) : '')} 
          />
        </div>

        <div className="mb-3">
          <label htmlFor="platformFees" className="form-label">Platform Fees</label>
          <input 
            type="number" 
            className="form-control" 
            id="platformFees" 
            value={item?.platformFees || ''} 
            onChange={(e) => updateItem('platformFees', e.target.value ? parseFloat(e.target.value) : '')} 
          />
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary">Evaluate Item</button>
      </form>

      <button onClick={handleManualSave} className="btn btn-primary mb-4">
        Save Draft
      </button>

      {lastAutoSave && (
        <div className="text-muted small">
          Last auto-save: {lastAutoSave.toLocaleTimeString()}
        </div>
      )}

      {/* Add the CSS animation */}
      <style>{fadeInOutAnimation}</style>

      {hasUnsavedChanges && <span className="text-warning">Unsaved changes</span>}
    </div>
  );
}

NewItemPage.propTypes = {
  setMostRecentItemId: PropTypes.func.isRequired,
  currentItemId: PropTypes.string.isRequired,
};

export default NewItemPage;
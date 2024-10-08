// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import { handleChatWithAssistant, analyzeImageWithGPT4Turbo, createUserMessage, createAssistantMessage } from './api/chat.js';
import axios from 'axios';
import UploadedImagesGallery from './components/compGallery.js';
import PropTypes from 'prop-types';
import ChatComp from './components/compChat.js';
import { 
  handleDraftSave, 
  handleAutoSave, 
  handleLocalSave, 
  loadLocalData, 
  clearLocalData, 
  updateContextData,
  createDefaultItem
} from './components/compSave.js';

// AI NOTE: Do not create new items in this file. New item creation should only be handled in App.js.

// Import all styled components
import {
  PageContainer,
  StyledHeader,
  StyledLogo,
  StyledTitle,
  StyledSubtitle,
  StyledForm,
  StyledFormGroup,
  StyledLabel,
  StyledInput,
  StyledSelect,
  StyledTextarea,
  StyledButton,
  StyledNotification,
  GlowingButton,
  ModalOverlay,
  ModalContent,
  ModalButton
} from './components/compStyles.js';

// Add this function near the top of your file, outside of the NewItemPage component
const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Add this function at the top of your file
const loadItemData = (itemId) => {
  return loadLocalData(itemId);
};

function NewItemPage({ setMostRecentItemId, currentItemId }) {
  const { itemId: paramItemId } = useParams();
  const [item, setItem] = useState(null);
  const navigate = useNavigate();
  const [contextData, setContextData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const backendPort = process.env.REACT_APP_BACKEND_PORT || 3001;
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  console.log('NewItemPage: Rendered with itemId from params:', paramItemId, 'and currentItemId prop:', currentItemId);

  useEffect(() => {
    const idToUse = paramItemId || currentItemId;
    console.log('NewItemPage: Using itemId:', idToUse);

    if (idToUse) {
      const loadedItem = loadItemData(idToUse);
      if (loadedItem) {
        console.log('NewItemPage: Loaded existing item:', loadedItem);
        setItem(loadedItem);
      } else {
        console.log('NewItemPage: Creating new item with ID:', idToUse);
        const newItem = createDefaultItem(idToUse);
        setItem(newItem);
        handleLocalSave(newItem, {}, []); // Save the new item immediately
      }
      setMostRecentItemId(idToUse);
    } else {
      console.error('NewItemPage: No valid itemId available');
    }

    // Cleanup function
    return () => {
      console.log('NewItemPage: Cleanup - Not clearing local data');
      // We're not clearing local data here anymore
    };
  }, [paramItemId, currentItemId, setMostRecentItemId]);

  // Prevent rendering until we have an item
  if (!item) {
    return <div>Loading...</div>;
  }

  const updateItem = (field, value) => {
    setItem(prevItem => {
      const updatedItem = { ...prevItem, [field]: value };
      console.log('updateItem: Updating item:', updatedItem);
      handleLocalSave(updatedItem, {}, []); // Save after each update
      return updatedItem;
    });
  };

  // Rename this function to avoid naming conflict
  const handleManualSave = async () => {
    try {
      const savedDraft = await handleDraftSave(item, messages, item.itemId, backendPort);
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
        handleAutoSave(item, messages, item.itemId, backendPort)
          .then(() => {
            setHasUnsavedChanges(false);
            setLastAutoSave(new Date());
          })
          .catch(error => console.error('Error auto-saving:', error));
      }
    }, 30000); // Auto-save every 30 seconds if there are unsaved changes

    return () => clearTimeout(timer);
  }, [item, hasUnsavedChanges, messages, backendPort]);

  // Save to localStorage
  useEffect(() => {
    if (item) {
      handleLocalSave(item, contextData, messages);
    }
  }, [item, contextData, messages]);

  // Clear localStorage on unmount
  useEffect(() => {
    return () => {
      if (item) {
        clearLocalData(item.itemId);
      }
    };
  }, [item]);

  const [isSubmitting, setIsSubmitting] = useState(false);

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
    localStorage.setItem(`messages_${item.itemId}`, JSON.stringify(newMessages));
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
      const updatedContextData = updateContextData(item.itemId, {
        lastAssistantResponse: response.content,
        lastUserMessage: imageFile ? imageSpecificInput : generalInput,
        // ... any other context updates
      });
      setContextData(updatedContextData);
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
    console.log("handleFileChange called in NewItemPage");
    const files = event.target.files;
    if (files && files.length > 0) {
      const image = files[0];
      console.log("Image file selected:", image.name);
      setImageFile(image);
      setImageAnalyzed(false);

      const imagePreviewUrl = URL.createObjectURL(image);
      setImagePreview(imagePreviewUrl);  // Set the image preview

      // Create the new image object
      const newImage = {
        id: Date.now().toString(),
        url: imagePreviewUrl,
        file: image
      };

      // Add the new image to the gallery and set it as selected immediately
      setUploadedImages(prevImages => [...prevImages, newImage]);
      setSelectedImage(newImage);
      setImageUploaded(true);

      // Safely update the item.images array
      setItem(prevItem => ({
        ...prevItem,
        images: Array.isArray(prevItem.images) ? [...prevItem.images, image] : [image]
      }));

      // Analyze the image
      setIsLoading(true);
      try {
        const assistantResponse = await analyzeImageWithGPT4Turbo(image, imageAnalysisPrompt);
        setMessages(prevMessages => [
          ...prevMessages,
          { role: 'user', content: 'Image uploaded', image: imagePreviewUrl },
          { role: 'assistant', content: assistantResponse }
        ]);
        setImageAnalyzed(true);

        // If you need the base64 version, you can add it here
        // newImage.base64 = await getBase64(image);
        // setUploadedImages(prevImages => prevImages.map(img => img.id === newImage.id ? {...img, base64: newImage.base64} : img));

      } catch (error) {
        console.error('Error analyzing image:', error);
        setMessages(prevMessages => [
          ...prevMessages,
          { role: 'user', content: 'Image upload failed', image: imagePreviewUrl },
          { role: 'assistant', content: 'Sorry, an error occurred while analyzing the image. Please try again.' }
        ]);
      }
      setIsLoading(false);
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
    formData.append('itemId', item.itemId);
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

  useEffect(() => {
    if (item) {
      return () => {
        localStorage.removeItem(`item_${item.itemId}`);
        localStorage.removeItem(`contextData_${item.itemId}`);
        localStorage.removeItem(`messages_${item.itemId}`);
      };
    }
  }, [item]);

  const handleStartLoading = () => {
    setIsLoading(true);
  };

  const handleEndLoading = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    if (uploadedImages.length > 0 && !selectedImage) {
      setSelectedImage(uploadedImages[uploadedImages.length - 1]);
    }
  }, [uploadedImages, selectedImage]);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      // You might want to add more logic here, like updating the item state
    }
  };

  return (
    <PageContainer>
      {showNotification && (
        <StyledNotification>
          Item successfully saved as draft
        </StyledNotification>
      )}

      <StyledHeader>
        <StyledLogo src={treasureSpecs} alt="Treasure Specs" />
        <StyledTitle>Add Your Thrifty Find</StyledTitle>
        <StyledSubtitle>Ready to turn that rusty gold into shiny cash? Let's get started!</StyledSubtitle>
      </StyledHeader>
      
      <ChatComp 
        item={item}
        updateItem={updateItem}
        messages={messages}
        setMessages={setMessagesAndSave}
        currentItemId={item.id}
        onFileChange={handleFileChange}  // Add this prop
        isLoading={isLoading}
        onStartLoading={handleStartLoading}
        onEndLoading={handleEndLoading}
        imageUploaded={imageUploaded}
        setImageUploaded={setImageUploaded}
        imagePreview={imagePreview}  // Pass the imagePreview to ChatComp
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />

      <GlowingButton 
        onClick={handleImageButtonClick}
        disabled={!isPromptLoaded || isLoading}
      >
        <i className="fas fa-image"></i> Add Images
      </GlowingButton>

      <UploadedImagesGallery
        images={uploadedImages}
        onSelect={handleImageSelect}
        selectedImage={selectedImage}
      />

      {/* Image Selection Modal */}
      {showImageModal && (
        <ModalOverlay onClick={() => setShowImageModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>Add Images</h2>
            <p>Choose how you'd like to add images:</p>
            <ModalButton onClick={handleCameraClick}>
              <i className="fas fa-camera"></i> Camera
            </ModalButton>
            <ModalButton onClick={handleMediaClick}>
              <i className="fas fa-folder-open"></i> Media
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
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

      <StyledForm onSubmit={handleSubmit}>
        <StyledFormGroup>
          <StyledLabel htmlFor="itemName">Item Name</StyledLabel>
          <StyledInput 
            type="text" 
            id="itemName" 
            value={item?.name || ''} 
            onChange={(e) => updateItem('name', e.target.value)} 
            required 
          />
        </StyledFormGroup>

        <StyledFormGroup>
          <StyledLabel htmlFor="brand">Brand</StyledLabel>
          <StyledInput 
            type="text" 
            id="brand" 
            value={item?.brand || ''} 
            onChange={(e) => updateItem('brand', e.target.value)} 
          />
        </StyledFormGroup>

        <StyledFormGroup>
          <StyledLabel htmlFor="condition">Condition</StyledLabel>
          <StyledSelect 
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
          </StyledSelect>
        </StyledFormGroup>

        <StyledFormGroup>
          <StyledLabel htmlFor="description">Description</StyledLabel>
          <StyledTextarea 
            id="description" 
            rows="3" 
            value={item?.description || ''} 
            onChange={(e) => updateItem('description', e.target.value)} 
          ></StyledTextarea>
        </StyledFormGroup>

        {/* Continue with the rest of your form fields using the styled components... */}

        <StyledButton type="submit">Evaluate Item</StyledButton>
      </StyledForm>

      <StyledButton onClick={handleManualSave}>
        Save Draft
      </StyledButton>

      {lastAutoSave && (
        <p>Last auto-save: {lastAutoSave.toLocaleTimeString()}</p>
      )}

      {hasUnsavedChanges && <span>Unsaved changes</span>}
    </PageContainer>
  );
}

NewItemPage.propTypes = {
  setMostRecentItemId: PropTypes.func.isRequired,
  currentItemId: PropTypes.string
};

export default NewItemPage;
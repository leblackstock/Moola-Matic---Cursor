// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import { handleChatWithAssistant, analyzeImageWithGPT4Turbo, createUserMessage, createAssistantMessage } from './api/chat.js';
import styled from 'styled-components';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Styled components for the UI
const StyledTextarea = styled.textarea`
  resize: none;
  overflow-y: hidden;
  min-height: 38px;
  max-height: 150px;
  flex: 1; /* Allow textarea to take up available space */
  border: none;
  background: transparent;
  color: #F5DEB3;
  font-size: 1em;
  padding: 0;
  margin: 0;
  
  &:focus {
    outline: none;
  }
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 10px;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 10px;
  background: ${props => props.$isUser ? 'linear-gradient(45deg, #2D0037, #4A0E4E)' : 'rgba(139, 0, 0, 0.8)'};
  color: #F5DEB3;
  text-align: ${props => props.$isUser ? 'right' : 'left'};
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(13, 0, 26, 0.6);
  border: 1px solid #4A0E4E;
  border-radius: 25px;
  padding: 5px 10px;
  margin-bottom: 10px;
  height: 50px; /* Set a fixed height for consistent alignment */
`;

const ImagePreview = styled.img`
  max-width: 40px;
  max-height: 40px;
  border-radius: 50%;
  margin-right: 10px;
`;

const ImageInputContainer = styled(InputContainer)`
  margin-bottom: 10px;
`;


const IconButton = styled.button`
  background: none;
  border: none;
  color: #F5DEB3;
  cursor: pointer;
  margin-left: 5px;
  font-size: 1.2em;
  transition: color 0.3s;

  &:hover {
    color: #00FFFF; /* Change to cyan on hover */
  }
  
  &:disabled {
    color: #A9A9A9;
    cursor: not-allowed;
  }
`;

const TextIcon = styled.i`
  color: #F5DEB3;
  margin-right: 10px;
  font-size: 1.2em;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Function to render assistant content with formatting
const renderContent = (content) => {
  let parsedContent;

  if (typeof content === 'string') {
    try {
      parsedContent = JSON.parse(content).assistantResponse;
    } catch (e) {
      parsedContent = content;
    }
  } else if (typeof content === 'object' && content.assistantResponse) {
    parsedContent = content.assistantResponse;
  } else {
    parsedContent = JSON.stringify(content);
  }

  if (typeof parsedContent === 'string') {
    const lines = parsedContent.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, i) => (
      <React.Fragment key={i}>
        {line.startsWith('###') ? (
          <h3 style={{marginBottom: '0.5em', marginTop: '0.5em'}}>{line.replace('###', '').trim()}</h3>
        ) : line.startsWith('##') ? (
          <h4 style={{marginBottom: '0.3em', marginTop: '0.3em'}}>{line.replace('##', '').trim()}</h4>
        ) : line.startsWith('#') ? (
          <h5 style={{marginBottom: '0.2em', marginTop: '0.2em'}}>{line.replace('#', '').trim()}</h5>
        ) : line.startsWith('-') ? (
          <li style={{marginBottom: '0.1em'}}>{line.replace('-', '').trim()}</li>
        ) : (
          <p style={{marginBottom: '0.1em', marginTop: '0.1em'}}>{line}</p>
        )}
      </React.Fragment>
    ));
  } else {
    return <p>{JSON.stringify(parsedContent)}</p>;
  }
};
function NewItemPage() {
  const location = useLocation();
  const draftItem = location.state?.draft;

  console.log("Received draft item:", draftItem);

  const [item, setItem] = useState({
    name: '',
    brand: '',
    condition: '',
    description: '',
    uniqueFeatures: '',
    accessories: '',
    purchasePrice: 0,
    salesTax: 0,
    cleaningNeeded: false,
    cleaningTime: 0,
    cleaningMaterialsCost: 0,
    estimatedValue: 0,
    shippingCost: 0,
    platformFees: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contextData, setContextData] = useState(() => {
    if (draftItem && draftItem.contextData) {
      console.log("Loading contextData from draft:", draftItem.contextData);
      return draftItem.contextData;
    } else {
      const savedContextData = localStorage.getItem(`contextData_${item.id}`);
      console.log("Loading contextData from localStorage:", savedContextData);
      return savedContextData ? JSON.parse(savedContextData) : {
        itemId: item.id,
        lastImageAnalysis: null,
        lastAssistantResponse: null,
        lastUserMessage: null,
      };
    }
  });

  // Update item state
  const updateItem = (field, value) => {
    setItem(prevItem => ({
      ...prevItem,
      [field]: value
    }));
  };

  const updateContextData = (newData) => {
    setContextData(prevData => {
      const updatedData = {
        ...prevData,
        ...newData,
        itemId: item.id
      };
      localStorage.setItem(`contextData_${item.id}`, JSON.stringify(updatedData));
      return updatedData;
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Submitting item:', item);
    // Perform validation and submission logic here
    // Example: Send data to backend API
    // fetch('/api/add-item', { method: 'POST', body: JSON.stringify(item), headers: { 'Content-Type': 'application/json' } })
    //   .then(response => response.json())
    //   .then(data => { /* Handle success */ })
    //   .catch(error => { /* Handle error */ })
    //   .finally(() => setIsSubmitting(false));
    setIsSubmitting(false);
  };

  // State for chat messages and AI interaction
  const [messages, setMessages] = useState(() => {
    if (draftItem && draftItem.messages) {
      console.log("Loading messages from draft:", draftItem.messages);
      return draftItem.messages;
    } else {
      const savedMessages = localStorage.getItem(`messages_${draftItem?.id || 'new'}`);
      console.log("Loading messages from localStorage:", savedMessages);
      return savedMessages ? JSON.parse(savedMessages) : [];
    }
  });

  console.log("Initial messages state:", messages);

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
        const result = await analyzeImageWithGPT4Turbo(imageFile, messageToSend, item.id);
        response = { content: result.assistantResponse, status: 'completed', contextData: result.contextData };
        
        if (!imageAnalyzed) {
          setImageAnalyzed(true);
        }
      } else {
        // Handle text-only messages
        response = await handleChatWithAssistant([...messages, { role: 'user', content: generalInput }], item.id);
      }

      console.log('Assistant response:', response);

      // Update the UI with the new message and response
      setMessages(prevMessages => {
        const newMessages = [
          ...prevMessages,
          { role: 'user', content: imageFile ? imageSpecificInput : generalInput },
          { role: 'assistant', content: response.content, source: 'moola-matic', status: response.status }
        ];
        localStorage.setItem(`messages_${item.id}`, JSON.stringify(newMessages));
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
      setMessages(prevMessages => [
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
      setImageAnalyzed(false);  // Reset the flag when a new image is uploaded

      const imagePreviewUrl = URL.createObjectURL(image);
      setImagePreview(imagePreviewUrl);

      // Add the image to the item.images array
      setItem(prevItem => {
        const newItem = {
          ...prevItem,
          images: [...prevItem.images, image]
        };
        localStorage.setItem(`item_${item.id}`, JSON.stringify(newItem));
        return newItem;
      });

      // Immediately analyze the image
      setIsLoading(true);
      try {
        const assistantResponse = await analyzeImageWithGPT4Turbo(image, imageAnalysisPrompt);
        // Add both the image and the assistant's response to the chat context
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
    formData.append('itemId', item.id);
    formData.append('contextData', JSON.stringify(contextData));

    try {
      const response = await fetch('/api/analyze-image', {
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
      
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: assistantResponse },
      ]);
    } catch (error) {
      console.error('Error in sendImageMessage:', error);
      setMessages(prevMessages => [
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
        localStorage.removeItem(`item_${item.id}`);
        localStorage.removeItem(`contextData_${item.id}`);
        localStorage.removeItem(`messages_${item.id}`);
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
    if (!draftItem) {
      localStorage.setItem(`item_${item.id}`, JSON.stringify(item));
    }
  }, [item, draftItem]);

  useEffect(() => {
    if (!draftItem) {
      localStorage.setItem(`contextData_${item.id}`, JSON.stringify(contextData));
    }
  }, [contextData, item.id, draftItem]);

  useEffect(() => {
    if (!draftItem) {
      localStorage.setItem(`messages_${item.id}`, JSON.stringify(messages));
    }
  }, [messages, item.id, draftItem]);

  useEffect(() => {
    // ... existing code ...

    return () => {
      localStorage.removeItem(`item_${item.id}`);
      localStorage.removeItem(`contextData_${item.id}`);
      localStorage.removeItem(`messages_${item.id}`);
    };
  }, [item.id]);

  const [lastAutoSave, setLastAutoSave] = useState(null);

  // Update the saveDraftAutomatically function
  const saveDraftAutomatically = async () => {
    try {
      const formData = new FormData();
      const itemCopy = { ...item };
      delete itemCopy.images; // Remove images from the JSON data
      const draftData = {
        ...itemCopy,
        id: item.id,
        messages: messages,
        contextData: contextData
      };
      console.log("Saving draft data:", draftData);
      formData.append('draftData', JSON.stringify(draftData));

      console.log('Item before saving:', item);
      console.log('Images before saving:', item.images);
      console.log('Messages before saving:', messages);
      console.log('ContextData before saving:', contextData);

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
      setLastAutoSave(new Date());

      // Update the local item state with the saved draft data
      setItem(prevItem => ({
        ...prevItem,
        ...savedDraft,
      }));

      // Set hasUnsavedChanges to false after successful save
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error('Error saving draft automatically:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveDraftAutomatically();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [item, messages, contextData]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update this useEffect to track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [item, messages, contextData]);

  // Add a separate function for the manual save button
  const handleManualSave = async () => {
    await saveDraftAutomatically();
    // Double-check that hasUnsavedChanges is set to false
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

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

  return (
    <div className="container">
      {showNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 128, 0, 0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 1000,
          animation: 'fadeInOut 3s ease-in-out'
        }}>
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
        <h3 className="text-center mb-4" style={{color: '#F5DEB3'}}>Moola-Matic Wizard</h3>
        <div className="messages" ref={messagesContainerRef}>
          <div ref={chatContainerRef} className="chat-history" style={{maxHeight: '400px', overflowY: 'auto'}}>
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <MessageContainer key={index} $isUser={message.role === 'user'}>
                  <MessageBubble $isUser={message.role === 'user'}>
                    {message.role === 'assistant' ? renderContent(message.content) : message.content}
                  </MessageBubble>
                </MessageContainer>
              ))
            ) : (
              <p>No chat history available.</p>
            )}
          </div>
          {isLoading && <div className="ai-typing">AI is typing...</div>}
        </div>

        {/* Image Input Box (conditionally rendered) */}
        {imageFile && (
          <ImageInputContainer>
            <ImagePreview src={imagePreview} alt="Preview" />
            <StyledTextarea
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
            <IconButton onClick={sendImageMessage} disabled={isLoading}>
              <i className="fas fa-paper-plane"></i>
            </IconButton>
          </ImageInputContainer>
        )}

        {/* Original Text Input Box */}
        <InputContainer>
          <TextIcon className="fas fa-comment"></TextIcon>
          <StyledTextarea
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
          <IconButton onClick={sendMessage} disabled={isLoading}>
            <i className="fas fa-paper-plane"></i>
          </IconButton>
        </InputContainer>
      </div>

      {/* Add Images Button */}
      <div className="mb-4 text-center">
        <button 
          className="btn btn-primary-theme" 
          onClick={handleImageButtonClick}
          disabled={!isPromptLoaded || isLoading}
        >
          <i className="fas fa-image me-2"></i>Add Images
        </button>
      </div>

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
          <input type="text" className="form-control" id="itemName" value={item.name} onChange={(e) => updateItem('name', e.target.value)} required />
        </div>

        <div className="mb-3">
          <label htmlFor="brand" className="form-label">Brand</label>
          <input type="text" className="form-control" id="brand" value={item.brand} onChange={(e) => updateItem('brand', e.target.value)} />
        </div>

        <div className="mb-3">
          <label htmlFor="condition" className="form-label">Condition</label>
          <select className="form-select" id="condition" value={item.condition} onChange={(e) => updateItem('condition', e.target.value)} required>
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
          <textarea className="form-control" id="description" rows="3" value={item.description} onChange={(e) => updateItem('description', e.target.value)}></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="uniqueFeatures" className="form-label">Unique Features</label>
          <input type="text" className="form-control" id="uniqueFeatures" value={item.uniqueFeatures} onChange={(e) => updateItem('uniqueFeatures', e.target.value)} />
        </div>

        <div className="mb-3">
          <label htmlFor="accessories" className="form-label">Accessories</label>
          <input type="text" className="form-control" id="accessories" value={item.accessories} onChange={(e) => updateItem('accessories', e.target.value)} />
        </div>

        {/* Purchase Information */}
        <div className="mb-3">
          <label htmlFor="purchasePrice" className="form-label">Purchase Price</label>
          <input type="number" className="form-control" id="purchasePrice" value={item.purchasePrice} onChange={(e) => updateItem('purchasePrice', parseFloat(e.target.value))} required />
        </div>

        <div className="mb-3">
          <label htmlFor="salesTax" className="form-label">Sales Tax</label>
          <input type="number" className="form-control" id="salesTax" value={item.salesTax} onChange={(e) => updateItem('salesTax', parseFloat(e.target.value))} />
        </div>

        {/* Repair and Cleaning */}
        <div className="mb-3">
          <label htmlFor="cleaningNeeded" className="form-label">Cleaning Needed?</label>
          <select className="form-select" id="cleaningNeeded" value={item.cleaningNeeded} onChange={(e) => updateItem('cleaningNeeded', e.target.value === 'true')}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        {item.cleaningNeeded && (
          <>
            <div className="mb-3">
              <label htmlFor="cleaningTime" className="form-label">Cleaning Time (hours)</label>
              <input type="number" className="form-control" id="cleaningTime" value={item.cleaningTime} onChange={(e) => updateItem('cleaningTime', parseFloat(e.target.value))} />
            </div>
            <div className="mb-3">
              <label htmlFor="cleaningMaterialsCost" className="form-label">Cleaning Materials Cost</label>
              <input type="number" className="form-control" id="cleaningMaterialsCost" value={item.cleaningMaterialsCost} onChange={(e) => updateItem('cleaningMaterialsCost', parseFloat(e.target.value))} />
            </div>
          </>
        )}

        {/* Resale Information */}
        <div className="mb-3">
          <label htmlFor="estimatedValue" className="form-label">Estimated Resale Value</label>
          <input type="number" className="form-control" id="estimatedValue" value={item.estimatedValue} onChange={(e) => updateItem('estimatedValue', parseFloat(e.target.value))} required />
        </div>

        <div className="mb-3">
          <label htmlFor="shippingCost" className="form-label">Estimated Shipping Cost</label>
          <input type="number" className="form-control" id="shippingCost" value={item.shippingCost} onChange={(e) => updateItem('shippingCost', parseFloat(e.target.value))} />
        </div>

        <div className="mb-3">
          <label htmlFor="platformFees" className="form-label">Platform Fees</label>
          <input type="number" className="form-control" id="platformFees" value={item.platformFees} onChange={(e) => updateItem('platformFees', parseFloat(e.target.value))} />
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

export default NewItemPage;
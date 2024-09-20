// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import { handleChatWithAssistant, analyzeImageWithGPT4Turbo } from './api/chat.js';
import styled from 'styled-components';

// Styled components for the UI
const StyledTextarea = styled.textarea`
  resize: none;
  overflow-y: hidden;
  min-height: 38px;
  max-height: 150px;
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
`;

const ImagePreview = styled.img`
  max-width: 40px;
  max-height: 40px;
  border-radius: 50%;
  margin-right: 10px;
`;

function NewItemPage() {
  const { itemId } = useParams();

  // State for the item details
  const [item, setItem] = useState({
    id: itemId,
    name: '',
    description: '',
    purchasePrice: 0,
    estimatedValue: 0,
    category: '',
    condition: '',
    images: [],
    purchaseDate: new Date().toISOString().split('T')[0],
    listingDate: new Date().toISOString().split('T')[0],
    sellerNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update item state
  const updateItem = (field, value) => {
    setItem(prevItem => ({
      ...prevItem,
      [field]: value
    }));
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
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

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
  const sendMessage = async (isImageQuestion = false) => {
    const input = textInput.trim();
    if (!input && !imageFile) return;

    const newMessage = {
      content: input || 'Image uploaded',
      role: 'user', // Explicitly set the role to 'user'
    };

    setTextInput('');
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setIsLoading(true);

    try {
      let updatedMessages = [...messages, newMessage];

      // Summarize messages if necessary
      updatedMessages = await summarizeMessages(updatedMessages);

      // Initialize variable to hold response
      let assistantResponses = [];

      if (imageFile && (isImageQuestion || messages.length === 0)) {
        // **Step 1:** Analyze the image with GPT-4 Turbo
        const analysisContent = await analyzeImageWithGPT4Turbo(imageFile, updatedMessages);
        const gptResponse = { role: 'assistant', content: analysisContent, source: 'gpt-4-turbo' };
        assistantResponses.push(gptResponse);

        // **Step 2:** Send GPT-4 Turbo's analysis to Moola-Matic Assistant
        const moolaMaticResponseContent = await handleChatWithAssistant([...updatedMessages, gptResponse]);
        const moolaMaticResponse = { role: 'assistant', content: moolaMaticResponseContent, source: 'moola-matic' };
        assistantResponses.push(moolaMaticResponse);
      } else {
        // Handle Text-Only Messages
        const chatContent = await handleChatWithAssistant(updatedMessages);
        const moolaMaticResponse = { role: 'assistant', content: chatContent, source: 'moola-matic' };
        assistantResponses.push(moolaMaticResponse);
      }

      // Update messages state with assistant responses
      setMessages(prevMessages => [...prevMessages, ...assistantResponses]);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      // Keep imageFile in state for future questions
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

      const imagePreviewUrl = URL.createObjectURL(image);
      setImagePreview(imagePreviewUrl);
    }
  };

  return (
    <div className="container">
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
          {messages.map((msg, index) => (
            <MessageContainer key={index} $isUser={msg.role === 'user'}>
              <MessageBubble $isUser={msg.role === 'user'}>
                <p>
                  {msg.role === 'user' ? 'You: ' : msg.source === 'moola-matic' ? 'Moola-Matic: ' : 'AI: '}
                  {msg.content}
                </p>
                {msg.image && (
                  <img 
                    src={msg.image} 
                    alt="Uploaded" 
                    className="uploaded-image" 
                    style={{maxWidth: '100%', marginTop: '10px'}} 
                  />
                )}
              </MessageBubble>
            </MessageContainer>
          ))}
          {isLoading && <div className="ai-typing">AI is typing...</div>}
        </div>

        {/* Input Container */}
        <InputContainer>
          {imagePreview && (
            <ImagePreview src={imagePreview} alt="Preview" />
          )}
          <StyledTextarea
            className="chat-input"
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(imageFile != null);
              }
            }}
            placeholder="Type your message here..."
            rows="1"
          />
          <button className="send-button" onClick={() => sendMessage(imageFile != null)} disabled={isLoading}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </InputContainer>
      </div>

      {/* Add Images Button */}
      <div className="mb-4 text-center">
        <button className="btn btn-primary-theme" onClick={handleImageButtonClick}>
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
        {/* Item Name */}
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Item Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            value={item.name}
            onChange={(e) => updateItem('name', e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            className="form-control"
            id="description"
            rows="3"
            value={item.description}
            onChange={(e) => updateItem('description', e.target.value)}
          ></textarea>
        </div>

        {/* Condition */}
        <div className="mb-3">
          <label htmlFor="condition" className="form-label">Condition</label>
          <select
            className="form-select"
            id="condition"
            value={item.condition}
            onChange={(e) => updateItem('condition', e.target.value)}
          >
            <option value="">Select condition</option>
            <option value="new">New</option>
            <option value="like-new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary mb-4" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Add Item'}
        </button>
      </form>
    </div>
  );
}

export default NewItemPage;

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import { handleChatWithAssistant, analyzeImageWithGPT4Turbo } from './api/chat.js';
import styled from 'styled-components';

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

const ImageInput = styled.input`
  display: none;
`;

const ImageButton = styled.button`
  background: none;
  border: none;
  color: #F5DEB3;
  font-size: 1.2em;
  cursor: pointer;
  padding: 5px;
  margin-right: 10px;
  transition: all 0.3s ease;

  &:hover {
    color: #40F4F0;
  }
`;

function NewItemPage() {
  const { itemId } = useParams();

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
  const [errors, setErrors] = useState({});

  const updateItem = (field, value) => {
    setItem(prevItem => ({
      ...prevItem,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Submitting item:', item);
    setIsSubmitting(false);
  };

  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageAnalysisHistory, setImageAnalysisHistory] = useState([]);

  const sendMessage = async (isImageQuestion = false) => {
    const input = isImageQuestion ? imageInput.trim() : textInput.trim();
    
    if (!input) return;

    let newMessage = {
      role: 'user',
      content: input
    };

    setTextInput('');
    setImageInput('');
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setIsLoading(true);
    setCurrentMessage('');

    try {
      let response;
      if (imagePreview && isImageQuestion) {
        const updatedImageHistory = [
          ...imageAnalysisHistory,
          newMessage
        ];
        response = await analyzeImageWithGPT4Turbo(imagePreview, updatedImageHistory);
        setImageAnalysisHistory(updatedImageHistory);
      } else {
        response = await handleChatWithAssistant([...messages, newMessage]);
      }
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }]);
    } finally {
      setIsLoading(false);
      if (isImageQuestion) {
        setImagePreview('');
        setShowImageInput(false);
      }
    }
  };

  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, currentMessage]);

  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleImageButtonClick = () => {
    setShowImageModal(true);
  };

  const handleCameraClick = () => {
    cameraInputRef.current.click();
    setShowImageModal(false);
  };

  const handleMediaClick = () => {
    fileInputRef.current.click();
    setShowImageModal(false);
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Files selected:', files);

      const imageFile = files[0];
      try {
        console.log('Image file:', imageFile);

        const imagePreviewUrl = URL.createObjectURL(imageFile);
        console.log('Image preview URL:', imagePreviewUrl);

        setImagePreview(imagePreviewUrl);
        setShowImageInput(true);

        // Log the current messages state before updating
        console.log('Current messages:', messages);

        setMessages(prevMessages => {
          const newMessages = [
            ...prevMessages,
            { role: 'user', image: imagePreviewUrl, content: 'Image uploaded' }
          ];
          console.log('Updated messages:', newMessages);
          return newMessages;
        });

        setIsLoading(true);

        const promptText = 'Analyze this image';
        console.log('Prompt text:', promptText);

        console.log('Calling analyzeImageWithGPT4Turbo with:', imageFile, promptText);
        const aiAnalysis = await analyzeImageWithGPT4Turbo(imageFile, promptText);
        console.log('AI Analysis result:', aiAnalysis);

        setImageAnalysisHistory([
          { role: 'user', content: 'Analyze this image' },
          { role: 'assistant', content: aiAnalysis }
        ]);
        console.log('Image analysis history updated');

        setMessages(prevMessages => {
          const newMessages = [
            ...prevMessages,
            { role: 'assistant', content: aiAnalysis }
          ];
          console.log('Final updated messages:', newMessages);
          return newMessages;
        });

      } catch (error) {
        console.error('Error processing image:', error);
        setMessages(prevMessages => {
          const newMessages = [
            ...prevMessages,
            { role: 'assistant', content: `Sorry, I encountered an error while processing the image: ${error.message}` }
          ];
          console.log('Error message added to messages:', newMessages);
          return newMessages;
        });
      } finally {
        setIsLoading(false);
        console.log('Loading state set to false');
      }
    } else {
      console.log('No files selected');
    }
  };

  return (
    <div className="container">
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
      
      <div className="ai-chat-box mb-5">
        <h3 className="text-center mb-4" style={{color: '#F5DEB3'}}>Moola-Matic Wizard</h3>
        <div className="messages" ref={messagesContainerRef}>
          {messages.map((msg, index) => (
            <MessageContainer key={index} $isUser={msg.role === 'user'}>
              <MessageBubble $isUser={msg.role === 'user'}>
                <p>{msg.role === 'user' ? 'You: ' : 'AI: '}{msg.content}</p>
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
          {currentMessage && (
            <MessageContainer $isUser={false}>
              <MessageBubble $isUser={false}>
                <p>AI: {currentMessage}</p>
              </MessageBubble>
            </MessageContainer>
          )}
          {isLoading && <div className="ai-typing">AI is typing</div>}
        </div>
        <InputContainer>
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
                sendMessage(false);
              }
            }}
            placeholder="Ask a general question..."
            rows="1"
          />
          <button className="send-button" onClick={() => sendMessage(false)} disabled={isLoading}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </InputContainer>

        {imagePreview && (
          <InputContainer>
            <ImagePreview src={imagePreview} alt="Preview" />
            <StyledTextarea
              className="chat-input"
              value={imageInput}
              onChange={(e) => {
                setImageInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(true);
                }
              }}
              placeholder="Ask about the image..."
              rows="1"
            />
            <button className="send-button" onClick={() => sendMessage(true)} disabled={isLoading}>
              <i className="fas fa-image"></i>
            </button>
          </InputContainer>
        )}
      </div>

      <div className="mb-4 text-center">
        <button className="btn btn-primary-theme" onClick={handleImageButtonClick}>
          <i className="fas fa-image me-2"></i>Add Images
        </button>
      </div>

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

      <input
        type="file"
        ref={cameraInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />

      <ImageInput
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <form onSubmit={handleSubmit}>
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

        <button type="submit" className="btn btn-primary mb-4" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Add Item'}
        </button>
      </form>
    </div>
  );
}

export default NewItemPage;
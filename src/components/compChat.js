// frontend/src/components/compChat.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { handleChatWithAssistant, analyzeImageWithGPT4Turbo, handleImageChat } from '../api/chat.js';
import styled from 'styled-components';
import '../App.css'; // Make sure to import the App.css file

const AIChatBox = styled.div`
  margin-bottom: 2rem;
  padding: 20px;
  background: rgba(13, 0, 26, 0.8);
  border: 2px solid #4A0E4E;
  border-radius: 15px;
  box-shadow: 0 0 30px rgba(138, 43, 226, 0.4); // BlueViolet glow
  transition: box-shadow 0.3s ease, transform 0.3s ease; // Added transform to transition

  &:hover {
    box-shadow: 0 0 40px rgba(138, 43, 226, 0.6); // Stronger BlueViolet glow on hover
    transform: translateY(-2px); // Move up by 2 pixels on hover
  }

  h3 {
    color: #F5DEB3;
    text-align: center;
    margin-bottom: 1rem;
  }
`;

const ChatHistory = styled.div`
  max-height: 600px;
  min-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;

  /* Webkit browsers (Chrome, Safari) */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(13, 0, 26, 0.4);
    border-radius: 10px;
    margin: 5px 0; /* Add some space at the top and bottom of the track */
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(138, 43, 226, 0.5);
    border-radius: 30px; /* Even more rounded */
    border: 3px solid rgba(13, 0, 26, 0.4); /* Thicker border for more padding */
    transition: background 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(138, 43, 226, 0.7);
  }

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(138, 43, 226, 0.5) rgba(13, 0, 26, 0.4);
`;

const AITyping = styled.div`
  color: #F5DEB3;
  font-style: italic;
  text-align: center;
  margin: 15px 0; // Increased margin top and bottom
  padding: 10px;  // Added padding
  position: relative;
  overflow: hidden;
  background: rgba(13, 0, 26, 0.4); // Slight background for separation
  border-radius: 10px; // Rounded corners
  box-shadow: 0 0 10px rgba(138, 43, 226, 0.3); // Subtle glow

  &:after {
    content: '...';
    position: absolute;
    width: 0;
    height: 100%;
    left: 0;
    animation: ellipsis 1.5s infinite;
    overflow: hidden;
  }

  @keyframes ellipsis {
    0% { width: 0; }
    33% { width: 10px; }
    66% { width: 20px; }
    100% { width: 30px; }
  }
`;

const MessagesContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
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
  color: #F5DEB3;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: ${props => props.$isUser 
    ? 'linear-gradient(45deg, #2D0037, #4A0E4E)'
    : 'rgba(139, 0, 0, 0.8)'};
  text-align: ${props => props.$isUser ? 'right' : 'left'};
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(13, 0, 26, 0.6);
  border: 1px solid #4A0E4E;
  border-radius: 25px;
  padding: 5px 10px;
  margin-bottom: 10px;
  height: 50px;
  box-shadow: 0 0 20px rgba(65, 105, 225, 0.5); // RoyalBlue glow
  transition: box-shadow 0.3s ease, transform 0.3s ease;

  &:hover {
    box-shadow: 0 0 25px rgba(65, 105, 225, 0.8); // Stronger RoyalBlue glow when hovered
    transform: translateY(-2px); // Move up by 2 pixels on hover
  }

  &:focus-within {
    box-shadow: 0 0 25px rgba(65, 105, 225, 0.8); // Stronger RoyalBlue glow when focused
    transform: translateY(-2px); // Move up by 2 pixels when focused
  }
`;

const ChatInput = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  color: #F5DEB3;
  font-size: 1em;
  resize: none;
  outline: none;
`;

const SendButton = styled.button`
  background: none;
  border: none;
  color: #F5DEB3;
  cursor: pointer;
  font-size: 1.2em;
  transition: color 0.3s ease;

  &:hover {
    color: #00FFFF; /* Cyan color on hover */
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ImageInputContainer = styled(InputContainer)`
  margin-bottom: 10px;
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  color: #F5DEB3;
  font-size: 1em;
  resize: none;
  outline: none;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #F5DEB3;
  cursor: pointer;
  font-size: 1.2em;
  transition: color 0.3s ease;

  &:hover {
    color: #00FFFF;
  }

  &:disabled {
    opacity: 0.5;
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

// Add this new styled component for the image preview
const ImagePreviewContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  flex-shrink: 0;
`;

const ImagePreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

// Add this new styled component for the loading indicator
const LoadingIndicator = styled.div`
  color: #F5DEB3;
  font-style: italic;
  text-align: center;
  margin: 15px 0;
  padding: 10px;
  background: rgba(13, 0, 26, 0.4);
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
  animation: pulse 1.5s infinite;
  z-index: 1000; // Ensure it's on top
  position: relative; // Ensure z-index works

  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

const StyledButton = styled.button`
  background: none;
  border: none;
  color: #F5DEB3;
  cursor: pointer;
  font-size: 1.2em;
  transition: color 0.3s ease;

  &:hover {
    color: #00FFFF;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function ChatComp({ item, updateItem, messages, setMessages, currentItemId, isLoading, onStartLoading, onEndLoading, imageUploaded, setImageUploaded, imagePreview: propImagePreview, selectedImage, setSelectedImage }) {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [localImagePreview, setLocalImagePreview] = useState(propImagePreview || '');
  const [imageInput, setImageInput] = useState('');
  const [imageAnalyzed, setImageAnalyzed] = useState(false);
  const [imageAnalysisPrompt, setImageAnalysisPrompt] = useState('');
  const [isPromptLoaded, setIsPromptLoaded] = useState(false);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Use propImagePreview or localImagePreview as needed
  const currentImagePreview = propImagePreview || localImagePreview;

  // Update localImagePreview when propImagePreview changes
  useEffect(() => {
    setLocalImagePreview(propImagePreview || '');
  }, [propImagePreview]);

  useEffect(() => {
    console.log("Component mounted or updated");
    return () => console.log("Component will unmount");
  });

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
      }
    };

    fetchImageAnalysisPrompt();
  }, []);

  // Helper function to convert File to base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setMessage('');
    onStartLoading();

    try {
      const response = await handleChatWithAssistant([...messages, { role: 'user', content: message }], currentItemId);
      
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'user', content: message },
        { role: 'assistant', content: response.content, source: 'moola-matic', status: response.status }
      ]);

      if (response.itemUpdates) {
        updateItem(response.itemUpdates);
      }
    } catch (error) {
      console.error('Error interacting with Moola-Matic assistant:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: 'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.' }
      ]);
    } finally {
      onEndLoading();
    }
  };

  const handleFileChange = async (event) => {
    console.log("handleFileChange called");
    const files = event.target.files;
    if (files && files.length > 0) {
      const image = files[0];
      console.log("Image file selected:", image.name);
      setImageFile(image);
      setImageAnalyzed(false);

      const imagePreviewUrl = URL.createObjectURL(image);
      setLocalImagePreview(imagePreviewUrl);

      onStartLoading(); // Call this instead of setIsLoading(true)

      try {
        console.log("Starting image analysis");
        // Simulate a delay to ensure we can see the loading state
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log("Calling analyzeImageWithGPT4Turbo");
        const assistantResponse = await analyzeImageWithGPT4Turbo(image, imageAnalysisPrompt, currentItemId);
        console.log("Received response from analyzeImageWithGPT4Turbo");

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
      } finally {
        onEndLoading(); // Call this instead of setIsLoading(false)
      }
    } else {
      console.log("No file selected");
    }
  };

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

  const sendImageMessage = async () => {
    if (!imageInput.trim() || !selectedImage) return;

    onStartLoading();

    try {
      const base64Image = await getBase64(selectedImage.file);
      const response = await handleImageChat(imageInput.trim(), base64Image, currentItemId, false);
      
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'user', content: imageInput.trim(), image: selectedImage.url },
        { role: 'assistant', content: response.advice }
      ]);

      if (response.contextData) {
        console.log('Updated context data:', response.contextData);
      }
    } catch (error) {
      console.error('Error processing image message:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: 'Sorry, an error occurred while processing your image message. Please try again.' }
      ]);
    } finally {
      onEndLoading();
      setImageInput('');
    }
  };

  return (
    <AIChatBox>
      <h3>Moola-Matic Wizard</h3>
      <ChatHistory ref={messagesContainerRef}>
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
      </ChatHistory>
      {isLoading && <LoadingIndicator>Processing your request...</LoadingIndicator>}
      {selectedImage && (
        <ImageInputContainer>
          <ImagePreviewContainer>
            <ImagePreview src={selectedImage.url} alt="Selected" />
          </ImagePreviewContainer>
          <StyledTextarea
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
      <InputContainer>
        <TextIcon className="fas fa-comment"></TextIcon>
        <StyledTextarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message here..."
          rows="1"
        />
        <IconButton onClick={sendMessage} disabled={isLoading}>
          <i className="fas fa-paper-plane"></i>
        </IconButton>
      </InputContainer>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />
    </AIChatBox>
  );
}

export default React.memo(ChatComp);
// frontend/src/components/compChat.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  handleChatWithAssistant,
  analyzeImageWithGPT4Turbo,
  handleImageChat,
} from '../api/chat.js';
import '../App.css';

// Import all styled components
import {
  AIChatBox,
  ChatHistory,
  AITyping,
  MessagesContainer,
  MessageContainer,
  MessageBubble,
  InputContainer,
  ChatInput,
  SendButton,
  ImageInputContainer,
  StyledTextarea,
  IconButton,
  TextIcon,
  ImagePreviewContainer,
  ImagePreview,
  LoadingIndicator,
  StyledButton,
  LoadingOverlay,
  LoadingSpinner,
} from './compStyles.js';

import PropTypes from 'prop-types';

function ChatComp({
  item,
  updateItem,
  messages,
  setMessages,
  currentItemId,
  isLoading,
  onStartLoading,
  onEndLoading,
  imageUploaded,
  setImageUploaded,
  imagePreview: propImagePreview,
  selectedImage,
  setSelectedImage,
}) {
  const [message, setMessage] = useState('');
  const [localImagePreview, setLocalImagePreview] = useState(
    propImagePreview || ''
  );
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
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
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
      reader.onerror = (error) => reject(error);
    });
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setMessage('');
    onStartLoading();

    try {
      const response = await handleChatWithAssistant(
        [...messages, { role: 'user', content: message }],
        currentItemId
      );

      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'user', content: message },
        {
          role: 'assistant',
          content: response.content,
          source: 'moola-matic',
          status: response.status,
        },
      ]);

      if (response.itemUpdates) {
        updateItem(response.itemUpdates);
      }
    } catch (error) {
      console.error('Error interacting with Moola-Matic assistant:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content:
            'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.',
        },
      ]);
    } finally {
      onEndLoading();
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
      const lines = parsedContent
        .split('\n')
        .filter((line) => line.trim() !== '');
      return lines.map((line, i) => (
        <React.Fragment key={i}>
          {line.startsWith('###') ? (
            <h3 style={{ marginBottom: '0.5em', marginTop: '0.5em' }}>
              {line.replace('###', '').trim()}
            </h3>
          ) : line.startsWith('##') ? (
            <h4 style={{ marginBottom: '0.3em', marginTop: '0.3em' }}>
              {line.replace('##', '').trim()}
            </h4>
          ) : line.startsWith('#') ? (
            <h5 style={{ marginBottom: '0.2em', marginTop: '0.2em' }}>
              {line.replace('#', '').trim()}
            </h5>
          ) : line.startsWith('-') ? (
            <li style={{ marginBottom: '0.1em' }}>
              {line.replace('-', '').trim()}
            </li>
          ) : (
            <p style={{ marginBottom: '0.1em', marginTop: '0.1em' }}>{line}</p>
          )}
        </React.Fragment>
      ));
    } else {
      return <p>{JSON.stringify(parsedContent)}</p>;
    }
  };

  return (
    <AIChatBox>
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
      <h3>Moola-Matic Wizard</h3>
      <ChatHistory ref={messagesContainerRef}>
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <MessageContainer key={index} $isUser={message.role === 'user'}>
              <MessageBubble $isUser={message.role === 'user'}>
                {message.role === 'assistant'
                  ? renderContent(message.content)
                  : message.content}
              </MessageBubble>
            </MessageContainer>
          ))
        ) : (
          <p>No chat history available.</p>
        )}
      </ChatHistory>
      {isLoading && (
        <LoadingIndicator>Processing your request...</LoadingIndicator>
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
    </AIChatBox>
  );
}

ChatComp.propTypes = {
  item: PropTypes.object,
  updateItem: PropTypes.func.isRequired,
  messages: PropTypes.array.isRequired,
  setMessages: PropTypes.func.isRequired,
  currentItemId: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  onStartLoading: PropTypes.func.isRequired,
  onEndLoading: PropTypes.func.isRequired,
  imageUploaded: PropTypes.bool.isRequired,
  setImageUploaded: PropTypes.func.isRequired,
  imagePreview: PropTypes.string,
  selectedImage: PropTypes.object,
  setSelectedImage: PropTypes.func.isRequired,
};

export default React.memo(ChatComp);

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
  const [imageFile, setImageFile] = useState(null);
  const [localImagePreview, setLocalImagePreview] = useState(
    propImagePreview || ''
  );
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
    console.log('Component mounted or updated');
    return () => console.log('Component will unmount');
  });

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

  const handleFileChange = async (event) => {
    console.log('handleFileChange called');
    const files = event.target.files;
    if (files && files.length > 0) {
      const image = files[0];
      console.log('Image file selected:', image.name);
      setImageFile(image);
      setImageAnalyzed(false);

      const imagePreviewUrl = URL.createObjectURL(image);
      setLocalImagePreview(imagePreviewUrl);

      onStartLoading(); // Call this instead of setIsLoading(true)

      try {
        console.log('Starting image analysis');
        // Simulate a delay to ensure we can see the loading state
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log('Calling analyzeImageWithGPT4Turbo');
        const assistantResponse = await analyzeImageWithGPT4Turbo(
          image,
          imageAnalysisPrompt,
          currentItemId
        );
        console.log('Received response from analyzeImageWithGPT4Turbo');

        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'user', content: 'Image uploaded', image: imagePreviewUrl },
          { role: 'assistant', content: assistantResponse },
        ]);
        setImageAnalyzed(true);
      } catch (error) {
        console.error('Error analyzing image:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: 'user',
            content: 'Image upload failed',
            image: imagePreviewUrl,
          },
          {
            role: 'assistant',
            content:
              'Sorry, an error occurred while analyzing the image. Please try again.',
          },
        ]);
      } finally {
        onEndLoading(); // Call this instead of setIsLoading(false)
      }
    } else {
      console.log('No file selected');
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

  const sendImageMessage = async () => {
    if (!imageInput.trim() || !selectedImage) return;

    onStartLoading();

    try {
      const base64Image = await getBase64(selectedImage.file);
      const response = await handleImageChat(
        imageInput.trim(),
        base64Image,
        currentItemId,
        false
      );

      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'user', content: imageInput.trim(), image: selectedImage.url },
        { role: 'assistant', content: response.advice },
      ]);

      if (response.contextData) {
        console.log('Updated context data:', response.contextData);
      }
    } catch (error) {
      console.error('Error processing image message:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content:
            'Sorry, an error occurred while processing your image message. Please try again.',
        },
      ]);
    } finally {
      onEndLoading();
      setImageInput('');
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

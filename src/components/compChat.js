// frontend/src/components/compChat.js

import React, { useState, useEffect, useRef } from 'react';
import { handleChatWithAssistant, analyzeImageWithGPT4Turbo, askQuestionAboutImage } from '../api/chat';
import styled from 'styled-components';

// Styled components for the chat UI
const ChatContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const MessagesContainer = styled.div`
  height: 400px;
  overflow-y: auto;
  border: 1px solid #4A0E4E;
  border-radius: 10px;
  padding: 10px;
  background-color: #1a001a;
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 10px;
`;

const MessageBubble = styled.div`
  background: ${props => props.$isUser ? 'linear-gradient(45deg, #2D0037, #4A0E4E)' : 'rgba(139, 0, 0, 0.8)'};
  color: #F5DEB3;
  padding: 10px 15px;
  border-radius: 10px;
  max-width: 70%;
  word-wrap: break-word;
`;

const InputArea = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
`;

const StyledInput = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #4A0E4E;
  border-radius: 20px;
  background-color: #330033;
  color: #F5DEB3;
  margin-right: 10px;
`;

const SendButton = styled.button`
  background: #4A0E4E;
  color: #F5DEB3;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 1em;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    background: #333333;
    cursor: not-allowed;
  }
`;

const ImageButton = styled.button`
  background: none;
  border: none;
  color: #F5DEB3;
  font-size: 1.5em;
  cursor: pointer;
  margin-right: 10px;

  &:hover {
    color: #40F4F0;
  }
`;

const ImagePreview = styled.img`
  max-width: 100px;
  max-height: 100px;
  margin-top: 10px;
  border-radius: 10px;
`;

function CompChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to the bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to send a message
  const sendMessage = async () => {
    if (!input.trim() && !imageFile) return;

    const newMessage = {
      role: 'user',
      content: input.trim() || 'Image uploaded',
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let responseContent;

      if (imageFile) {
        responseContent = await analyzeImageWithGPT4Turbo(imageFile, [...messages, newMessage]);
      } else {
        responseContent = await handleChatWithAssistant([...messages, newMessage]);
      }

      const assistantMessage = {
        role: 'assistant',
        content: responseContent,
      };

      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <ChatContainer>
      <h2>Moola-Matic Chat</h2>
      <MessagesContainer>
        {messages.map((msg, index) => (
          <Message key={index} $isUser={msg.role === 'user'}>
            <MessageBubble $isUser={msg.role === 'user'}>
              {msg.content}
              {msg.image && <ImagePreview src={msg.image} alt="Uploaded" />}
            </MessageBubble>
          </Message>
        ))}
        {isLoading && <MessageBubble>AI is typing...</MessageBubble>}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <InputArea>
        <ImageButton onClick={() => document.getElementById('image-upload').click()}>
          📷
        </ImageButton>
        <StyledInput
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <SendButton onClick={sendMessage} disabled={isLoading}>
          ➤
        </SendButton>
      </InputArea>
      <input
        type="file"
        id="image-upload"
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleImageUpload}
      />
      {imagePreview && <ImagePreview src={imagePreview} alt="Preview" />}
    </ChatContainer>
  );
}

export default CompChat;

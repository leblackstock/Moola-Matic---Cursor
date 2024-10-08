// frontend\src\components\compStyles.js

import styled from 'styled-components';

export const StyledContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

export const StyledHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

export const StyledLogo = styled.img`
  max-width: 200px;
  margin-bottom: 1rem;
`;

export const StyledTitle = styled.h2`
  color: #F5DEB3;
  margin-bottom: 0.5rem;
`;

export const StyledSubtitle = styled.p`
  color: #D3D3D3;
`;

export const StyledButton = styled.button`
  background: linear-gradient(45deg, #2D0037, #4A0E4E);
  color: #F5DEB3;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(45deg, #4A0E4E, #2D0037);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const StyledFormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StyledLabel = styled.label`
  color: #F5DEB3;
  margin-bottom: 0.5rem;
  display: block;
`;

export const StyledInput = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #4A0E4E;
  background: rgba(13, 0, 26, 0.6);
  color: #F5DEB3;
`;

export const StyledSelect = styled.select`
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #4A0E4E;
  background: rgba(13, 0, 26, 0.6);
  color: #F5DEB3;
`;

export const StyledTextarea = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  color: #F5DEB3;
  font-size: 1em;
  resize: none;
  outline: none;
`;

export const StyledNotification = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 128, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 1000;
  animation: fadeInOut 3s ease-in-out;

  @keyframes fadeInOut {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
  }
`;

export const GlowingButton = styled(StyledButton)`
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  margin-bottom: 20px;

  &:hover {
    box-shadow: 0 0 15px rgba(138, 43, 226, 0.7); // BlueViolet glow
    transform: translateY(-2px);
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background: rgba(13, 0, 26, 0.9);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
`;

export const ModalButton = styled(GlowingButton)`
  margin: 10px;
  width: 120px;
`;

export const ChatContainer = styled.div`
  position: relative;
  // Add any other styles you want for the chat container
`;

export const AIChatBox = styled(ChatContainer)`
  margin-bottom: 2rem;
  padding: 20px;
  background: rgba(13, 0, 26, 0.8);
  border: 2px solid #4A0E4E;
  border-radius: 15px;
  box-shadow: 0 0 30px rgba(138, 43, 226, 0.4);
  transition: box-shadow 0.3s ease, transform 0.3s ease;

  &:hover {
    box-shadow: 0 0 40px rgba(138, 43, 226, 0.6);
    transform: translateY(-2px);
  }

  h3 {
    color: #F5DEB3;
    text-align: center;
    margin-bottom: 1rem;
  }
`;

export const ChatHistory = styled.div`
  max-height: 600px;
  min-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(13, 0, 26, 0.4);
    border-radius: 10px;
    margin: 5px 0;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(138, 43, 226, 0.5);
    border-radius: 30px;
    border: 3px solid rgba(13, 0, 26, 0.4);
    transition: background 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(138, 43, 226, 0.7);
  }

  scrollbar-width: thin;
  scrollbar-color: rgba(138, 43, 226, 0.5) rgba(13, 0, 26, 0.4);
`;

export const AITyping = styled.div`
  color: #F5DEB3;
  font-style: italic;
  text-align: center;
  margin: 15px 0;
  padding: 10px;
  position: relative;
  overflow: hidden;
  background: rgba(13, 0, 26, 0.4);
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(138, 43, 226, 0.3);

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

export const MessagesContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

export const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 10px;
`;

export const MessageBubble = styled.div`
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

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(13, 0, 26, 0.6);
  border: 1px solid #4A0E4E;
  border-radius: 25px;
  padding: 5px 10px;
  margin-bottom: 10px;
  height: 50px;
  box-shadow: 0 0 20px rgba(65, 105, 225, 0.5);
  transition: box-shadow 0.3s ease, transform 0.3s ease;

  &:hover, &:focus-within {
    box-shadow: 0 0 25px rgba(65, 105, 225, 0.8);
    transform: translateY(-2px);
  }
`;

export const ChatInput = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  color: #F5DEB3;
  font-size: 1em;
  resize: none;
  outline: none;
`;

export const SendButton = styled.button`
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

export const ImageInputContainer = styled(InputContainer)`
  margin-bottom: 10px;
`;

export const IconButton = styled.button`
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

export const TextIcon = styled.i`
  color: #F5DEB3;
  margin-right: 10px;
  font-size: 1.2em;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ImagePreviewContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  flex-shrink: 0;
`;

export const ImagePreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const LoadingIndicator = styled.div`
  color: #F5DEB3;
  font-style: italic;
  text-align: center;
  margin: 15px 0;
  padding: 10px;
  background: rgba(13, 0, 26, 0.4);
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
`;

export const LoadingEllipsis = styled.span`
  &:after {
    content: '...';
    animation: ellipsis 1.5s infinite;
    overflow: hidden;
  }

  @keyframes ellipsis {
    0% { content: '.'; }
    33% { content: '..'; }
    66% { content: '...'; }
  }
`;

export const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

export const PageTitle = styled.h1`
  color: #F5DEB3;
  text-align: center;
  margin-bottom: 1rem;
`;

export const PageSubtitle = styled.p`
  color: #D3D3D3;
  text-align: center;
  margin-bottom: 2rem;
`;

export const DeleteButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(255, 0, 0, 1);
  }
`;

export const ItemList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

export const ItemListItem = styled.li`
  background: rgba(13, 0, 26, 0.6);
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ItemPrice = styled.span`
  background: #4A0E4E;
  color: #F5DEB3;
  padding: 5px 10px;
  border-radius: 20px;
`;

export const DraftGallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 2rem;
`;

export const DraftItem = styled.div`
  background-size: cover;
  background-position: center;
  height: 200px;
  position: relative;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

export const DraftItemOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #F5DEB3;
  padding: 10px;
`;

export const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent; // Changed to transparent
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

export const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(245, 222, 179, 0.3); // Wheat color with transparency
  border-top: 4px solid #F5DEB3; // Solid Wheat color for contrast
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 15px rgba(138, 43, 226, 0.5); // Added glow effect

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
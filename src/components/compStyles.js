// frontend\src\components\compStyles.js

import styled, { keyframes } from 'styled-components';

// Keyframes
const fadeInOut = keyframes`
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
`;

const squareToCircle = keyframes`
  0%, 16.66% {
    border-radius: 10%;
    background: coral;
    transform: rotate(0deg) scale(0.7);
  }
  33.33% {
    border-radius: 50% 10% 10% 10%;
    background: darksalmon;
    transform: rotate(90deg) scale(0.8);
  }
  50% {
    border-radius: 50% 50% 10% 10%;
    background: indianred;
    transform: rotate(180deg) scale(0.9);
  }
  66.66% {
    border-radius: 50% 50% 50% 10%;
    background: lightcoral;
    transform: rotate(270deg) scale(0.8);
  }
  83.33%, 100% {
    border-radius: 50%;
    background: darksalmon;
    transform: rotate(360deg) scale(0.7);
  }
`;

const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

// Define a glow animation
const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(245, 222, 179, 0.5); }
  50% { box-shadow: 0 0 20px rgba(245, 222, 179, 0.8); }
  100% { box-shadow: 0 0 5px rgba(245, 222, 179, 0.5); }
`;

// Define a subtle float animation
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

// Define a subtle pulse animation
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Add this keyframe animation at the top of your file
const glowAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
`;

// Gallery Components
export const ImageContainer = styled.div`
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  border-radius: 8px; // Increased from 5px to 8px
  overflow: hidden;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  height: 150px; // Added fixed height

  ${(props) =>
    props.$isSelected &&
    `
    transform: scale(1.05);
    z-index: 1;
    box-shadow: 
      0 0 10px 5px rgba(0, 255, 255, 0.5),
      0 0 20px 10px rgba(0, 255, 255, 0.3),
      0 0 30px 15px rgba(0, 255, 255, 0.1);
  `}
`;

// Layout Components
export const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
`;

export const Content = styled.div`
  flex-grow: 1;
  padding: 20px;
  padding-left: 80px;
  width: 100%;
`;

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(45deg, #0d001a, #1a0022, #2d0037);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 20px 10px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

export const MainContent = styled.main`
  flex-grow: 1;
  padding: 20px;
  padding-left: 80px; // This ensures content doesn't get covered by the collapsed sidebar
  width: 100%;

  @media (max-width: 768px) {
    padding-left: 20px; // Adjust padding for mobile view
  }
`;

export const StyledContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

// Header Components
export const StyledHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

export const StyledLogo = styled.img`
  max-width: 200px;
  margin-bottom: 1rem;
`;

export const StyledTitle = styled.h2`
  color: #f5deb3;
  margin-bottom: 0.5rem;
`;

export const StyledSubtitle = styled.p`
  color: #d3d3d3;
`;

export const PageTitle = styled.h1`
  color: #f5deb3;
  text-align: center;
  margin-bottom: 1rem;
`;

export const PageSubtitle = styled.p`
  color: #d3d3d3;
  text-align: center;
  margin-bottom: 2rem;
`;

// Button Components
export const StyledButton = styled.button`
  background: linear-gradient(45deg, #2d0037, #4a0e4e);
  color: #f5deb3;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: auto; // Change from 100% to auto
  min-width: 120px; // Add a minimum width
  max-width: 200px; // Add a maximum width
  margin: 10px auto; // Center the button and add some vertical spacing

  &:hover {
    background: linear-gradient(45deg, #4a0e4e, #2d0037);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const GlowingButton = styled(StyledButton)`
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;
  margin: 10px 5px; // This adds additional margin to each button

  &:hover {
    box-shadow: 0 0 15px rgba(138, 43, 226, 0.7); // BlueViolet glow
    transform: translateY(-2px);
  }
`;

export const ModalButton = styled(GlowingButton)`
  margin: 10px;
  width: 120px;
`;

export const SendButton = styled(StyledButton)`
  background: none;
  border: none;
  color: #f5deb3;
  font-size: 1.2em;
  padding: 5px 10px;

  &:hover {
    color: #00ffff; /* Cyan color on hover */
  }
`;

export const IconButton = styled(StyledButton)`
  background: none;
  border: none;
  color: #f5deb3;
  font-size: 1.2em;
  padding: 5px 10px;

  &:hover {
    color: #00ffff;
  }
`;

export const StyledDeleteButton = styled.button`
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
  transition:
    background-color 0.3s ease,
    opacity 0.3s ease;
  opacity: 0;

  &:hover {
    background-color: rgba(255, 0, 0, 1);
  }

  ${ImageContainer}:hover & {
    opacity: 1;
  }
`;

export const HoverDeleteButton = styled.button`
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
  transition: opacity 0.3s ease;
  opacity: 0;

  ${ImageContainer}:hover & {
    opacity: 1;
  }
`;

// Form Components
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
  color: #f5deb3;
  margin-bottom: 0.5rem;
  display: block;
`;

export const StyledInput = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #4a0e4e;
  background: rgba(13, 0, 26, 0.6);
  color: #f5deb3;
`;

export const StyledSelect = styled.select`
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #4a0e4e;
  background: rgba(13, 0, 26, 0.6);
  color: #f5deb3;
`;

export const StyledTextarea = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  color: #f5deb3;
  font-size: 1em;
  resize: none;
  outline: none;
`;

// Notification Components
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
    0% {
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
`;

export const Notification = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border-radius: 5px;
  z-index: 1000;
  animation: ${fadeInOut} 3s ease-in-out;
`;

// Modal Components
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

// Chat Components
export const ChatContainer = styled.div`
  position: relative;
  // Add any other styles you want for the chat container
`;

export const AIChatBox = styled(ChatContainer)`
  margin-bottom: 2rem;
  padding: 20px;
  background: rgba(13, 0, 26, 0.8);
  border: 2px solid #4a0e4e;
  border-radius: 15px;
  box-shadow: 0 0 30px rgba(138, 43, 226, 0.4);
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;

  &:hover {
    box-shadow: 0 0 40px rgba(138, 43, 226, 0.6);
    transform: translateY(-2px);
  }

  h3 {
    color: #f5deb3;
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
  color: #f5deb3;
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
    0% {
      width: 0;
    }
    33% {
      width: 10px;
    }
    66% {
      width: 20px;
    }
    100% {
      width: 30px;
    }
  }
`;

export const MessagesContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

export const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.$isUser ? 'flex-end' : 'flex-start')};
  margin-bottom: 10px;
`;

export const MessageBubble = styled.div`
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 10px;
  color: #f5deb3;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: ${(props) =>
    props.$isUser
      ? 'linear-gradient(45deg, #2D0037, #4A0E4E)'
      : 'rgba(139, 0, 0, 0.8)'};
  text-align: ${(props) => (props.$isUser ? 'right' : 'left')};
`;

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(13, 0, 26, 0.6);
  border: 1px solid #4a0e4e;
  border-radius: 25px;
  padding: 5px 10px;
  margin-bottom: 10px;
  height: 50px;
  box-shadow: 0 0 20px rgba(65, 105, 225, 0.5);
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;

  &:hover,
  &:focus-within {
    box-shadow: 0 0 25px rgba(65, 105, 225, 0.8);
    transform: translateY(-2px);
  }
`;

export const ChatInput = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  color: #f5deb3;
  font-size: 1em;
  resize: none;
  outline: none;
`;

export const ImageInputContainer = styled(InputContainer)`
  margin-bottom: 10px;
`;

export const TextIcon = styled.i`
  color: #f5deb3;
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
  color: #f5deb3;
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
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
`;

// Sidebar Components
export const Sidebar = styled.nav`
  width: 60px;
  height: 100vh;
  background: rgba(13, 0, 26, 0.8);
  padding: 20px 10px;
  transition: all 0.3s ease;
  overflow: hidden;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  box-shadow: 0 0 15px rgba(138, 43, 226, 0.3);
  backdrop-filter: blur(4px);

  &:hover {
    width: 250px;
    box-shadow: 0 0 25px rgba(138, 43, 226, 0.5);
  }

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: relative;
    display: flex;
    justify-content: space-around;
    padding: 10px;
  }
`;

export const NavLink = styled.a`
  color: #f5deb3;
  padding: 10px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  text-decoration: none;
  width: 40px;
  overflow: hidden;
  position: relative;
  text-transform: uppercase;
  cursor: pointer;
  border: none;
  background: transparent;

  ${Sidebar}:hover & {
    width: 100%;
  }

  i {
    margin-right: 15px;
    font-size: 1.2em;
    min-width: 20px;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 30px;
      background: radial-gradient(
        circle,
        rgba(0, 255, 255, 0.1) 0%,
        rgba(0, 255, 255, 0) 70%
      );
      border-radius: 50%;
      z-index: -1;
      opacity: 1;
    }
  }

  &.active i {
    color: #00ffff;
    text-shadow:
      0 0 10px #00ffff,
      0 0 20px #00ffff,
      0 0 30px #00ffff;

    &::after {
      background: radial-gradient(
        circle,
        rgba(0, 255, 255, 0.2) 0%,
        rgba(0, 255, 255, 0) 70%
      );
    }
  }

  span {
    opacity: 0;
    transition: opacity 0.3s ease;
    white-space: nowrap;
  }

  ${Sidebar}:hover & span {
    opacity: 1;
  }

  &:hover {
    background: linear-gradient(
      90deg,
      rgba(138, 43, 226, 0.2) 0%,
      rgba(138, 43, 226, 0.1) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: ${glowAnimation} 1s ease-in-out forwards;

    i {
      color: #00ffff;
      text-shadow:
        0 0 10px #00ffff,
        0 0 20px #00ffff,
        0 0 30px #00ffff;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    margin-bottom: 0;
    padding: 5px;

    i {
      margin-bottom: 5px;
      margin-right: 0;
    }

    span {
      display: inline;
      opacity: 1;
      font-size: 0.8em;
    }
  }
`;

// Table Components
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;

  th,
  td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }
`;

// Logo Components
export const LogoContainer = styled.div`
  width: 240px;
  height: 240px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 10%;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Logo = styled.img`
  width: 200px;
  height: 200px;
  object-fit: contain;
  animation: ${squareToCircle} 6s infinite alternate ease-in-out;
`;

export const StaticLogo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10%; // This will round the corners
`;

// Warning Box Components
export const WarningBoxOverlay = styled(ModalOverlay)`
  // This will inherit styles from ModalOverlay
`;

export const WarningBox = styled(ModalContent)`
  // This will inherit styles from ModalContent
  max-width: 400px;
`;

export const WarningBoxButtons = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
`;

export const WarningButton = styled(ModalButton)`
  &.proceed {
    &:hover {
      box-shadow: 0 0 15px rgba(255, 0, 0, 0.7); // Red glow
    }
  }
`;

// Gallery Components
export const GalleryContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;

  ${(props) =>
    props.$isDraftGallery &&
    `
    flex-direction: row;
    @media (max-width: 768px) {
      flex-direction: column;
    }
  `}
`;

export const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  ${ImageContainer}:hover & {
    transform: scale(1.1);
  }
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
  transition:
    background-color 0.3s ease,
    opacity 0.3s ease;
  opacity: 0;

  &:hover {
    background-color: rgba(255, 0, 0, 1);
  }

  ${ImageContainer}:hover & {
    opacity: 1;
  }
`;

export const DraftItemOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #f5deb3;
  padding: 10px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;

  ${ImageContainer}:hover & {
    opacity: 1;
  }
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

  &:hover ${DeleteButton}, &:hover ${DraftItemOverlay} {
    opacity: 1;
  }
`;

export const DraftGallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 2rem;
`;

// Loading Components
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
  border-top: 4px solid #f5deb3; // Solid Wheat color for contrast
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 15px rgba(138, 43, 226, 0.5); // Added glow effect

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

// List Components
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
  background: #4a0e4e;
  color: #f5deb3;
  padding: 5px 10px;
  border-radius: 20px;
`;

export const MainContentArea = styled.div`
  width: 100%;
  max-width: 800px; // Adjust this value as needed
  margin: 0 auto;
`;

// Add this near the other styled components
export const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap; // Allow buttons to wrap on smaller screens
  gap: 10px; // Reduce the gap between buttons
  margin: 20px 0;
`;

// Add a new component for form buttons
export const FormButton = styled(StyledButton)`
  width: 100%; // Make form buttons full width
  max-width: none; // Remove max-width for form buttons
`;

// Make sure this is included in the exports
// export const SelectedImageOverlay = styled.div`
//   position: absolute;
//   top: -8px;
//   left: -8px;
//   right: -8px;
//   bottom: -8px;
//   background: transparent;
//   box-shadow: 0 0 30px 15px rgba(0, 255, 255, 0.8);
//   pointer-events: none;
//   z-index: -1;
// `;

export const ErrorImagePlaceholder = styled.div`
  display: none;
  width: 100%;
  height: 100%;
  background-color: #ff6b6b; // A light red color, you can adjust as needed
  color: white;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 10px;
  box-sizing: border-box;
  font-size: 14px;
`;

export const PurchasedItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin: 10px;
  width: 200px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

export const PurchasedItemDetails = styled.div`
  padding: 10px;
  background-color: #f8f8f8;

  h4 {
    margin: 0 0 5px 0;
    font-size: 16px;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
`;

export const ItemOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;

  ${ImageContainer}:hover & {
    transform: translateY(0);
  }

  h4 {
    margin: 0 0 5px 0;
    font-size: 16px;
  }

  p {
    margin: 0 0 5px 0;
    font-size: 12px;
  }
`;

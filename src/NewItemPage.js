import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import { handleChatRequest, handleImageUpload } from './api/chat'; // Update this import
import styled from 'styled-components'; // Add this new import

// Add this styled component definition
const StyledTextarea = styled.textarea`
  resize: none;
  overflow-y: hidden;
  min-height: 38px;
  max-height: 150px;
`;

function NewItemPage() {
  const { itemId } = useParams(); // Assuming you're using react-router and passing itemId as a URL parameter

  const [item, setItem] = useState({
    id: itemId, // Set the id to the itemId from the URL
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

  // Function to update item properties
  const updateItem = (field, value) => {
    setItem(prevItem => ({
      ...prevItem,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Add logic to submit the item data
    console.log('Submitting item:', item);
    setIsSubmitting(false);
  };

  // New state for chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setCurrentMessage('');

    try {
      await handleChatRequest(newMessages, (content, isComplete) => {
        if (isComplete) {
          setMessages(prevMessages => [...prevMessages, { role: 'assistant', content }]);
          setCurrentMessage('');
        } else {
          setCurrentMessage(prevMessage => prevMessage + content);
        }
      });
    } catch (error) {
      console.error('Error:', error);
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Modify this ref
  const messagesContainerRef = useRef(null);

  // Update this effect
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, currentMessage]);

  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null); // Add this new ref

  const handleImageButtonClick = () => {
    setShowImageModal(true);
  };

  const handleCameraClick = () => {
    cameraInputRef.current.click();
    setShowImageModal(false);
  };

  const handleMediaClick = () => {
    fileInputRef.current.click();
    setShowImageModal(false); // Close the modal immediately when opening file picker
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Files selected:', files);
      setItem(prevItem => ({
        ...prevItem,
        images: [...prevItem.images, ...Array.from(files)]
      }));

      // Send the first selected image to the AI chatbot
      const imageFile = files[0];
      await sendImageToAI(imageFile);
    }
    setShowImageModal(false);
  };

  const sendImageToAI = async (imageFile) => {
    setIsLoading(true);
    try {
      const imageUrl = await handleImageUpload(imageFile);
      console.log("Image uploaded, URL:", imageUrl);
      
      const newMessage = { role: 'user', content: "I've uploaded an image. Can you describe it?" };
      const newMessages = [...messages, newMessage];
      setMessages(newMessages);
      
      await handleChatRequest(newMessages, (content, isComplete) => {
        if (isComplete) {
          setMessages(prevMessages => [...prevMessages, { role: 'assistant', content }]);
          setCurrentMessage('');
        } else {
          setCurrentMessage(prevMessage => prevMessage + content);
        }
      }, imageUrl); // Pass imageUrl here, not imageFile
    } catch (error) {
      console.error('Error sending image to AI:', error);
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: 'Sorry, an error occurred while processing the image. Please try again.' }]);
    } finally {
      setIsLoading(false);
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
      
      {/* Updated Chat interface */}
      <div className="ai-chat-box mb-5">
        <h3 className="text-center mb-4" style={{color: '#F5DEB3'}}>Moola-Matic Wizard</h3>
        <div 
          className="messages p-3 mb-3" 
          style={{height: '300px', overflowY: 'auto'}}
          ref={messagesContainerRef} // Add this line
        >
          {messages.map((msg, index) => (
            <div key={index} className={msg.role === 'user' ? 'user-message' : 'ai-message'}>
              <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
            </div>
          ))}
          {currentMessage && (
            <div className="ai-message">
              <strong>AI:</strong> {currentMessage}
            </div>
          )}
          {isLoading && <div className="ai-typing">AI is typing</div>}
        </div>
        <div className="input-area d-flex">
          <StyledTextarea
            className="chat-input form-control me-2"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            rows="1"
          ></StyledTextarea>
          <button className="send-button" onClick={sendMessage} disabled={isLoading}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {/* Modify the Add Images button */}
      <div className="mb-4 text-center">
        <button className="btn btn-primary-theme" onClick={handleImageButtonClick}>
          <i className="fas fa-image me-2"></i>Add Images
        </button>
      </div>

      {/* Add this custom modal using the provided CSS classes */}
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

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
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
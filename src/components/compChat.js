import React, { useState } from 'react';
import { handleChatRequest, handleImageUpload, handleChatWithAssistant, analyzeImageWithGPT4Turbo } from '../api/chat';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageInput, setImageInput] = useState('');

  const sendMessage = async (isImageQuestion = false) => {
    const messageContent = isImageQuestion ? imageInput.trim() : input.trim();
    if (!messageContent && !imageFile) return;

    const newMessage = messageContent ? { role: 'user', content: messageContent } : null;
    let aiResponse;

    if (imageFile) {
      // Send image for analysis to GPT-4 Turbo
      const imageAnalysis = await analyzeImageWithGPT4Turbo(imageFile, messageContent || "Analyze this image");
      const messagesWithAnalysis = [
        ...messages,
        ...(newMessage ? [newMessage] : []),
        { role: 'assistant', content: `Image analysis: ${imageAnalysis}` }
      ];

      // Send everything (image + analysis + message) to the Moola-Matic assistant
      aiResponse = await handleChatWithAssistant(messagesWithAnalysis);
    } else {
      const newMessages = [...messages, newMessage];
      aiResponse = await handleChatWithAssistant(newMessages);
    }

    if (aiResponse) {
      setMessages(prevMessages => [
        ...prevMessages,
        ...(newMessage ? [newMessage] : []),
        { role: 'assistant', content: aiResponse }
      ]);
    }

    // Clear inputs and reset state
    setInput('');
    setImageInput('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.role === 'image' ? (
              <img src={message.content} alt="Uploaded" className="uploaded-image" />
            ) : (
              message.content
            )}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
        />
        {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview" />}
        <button onClick={() => sendMessage()}>Send</button>
      </div>
      {imageFile && (
        <div className="image-input-area">
          <textarea
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            placeholder="Ask a question about the image..."
            rows="2"
          ></textarea>
          <button onClick={() => sendMessage(true)}>Ask About Image</button>
        </div>
      )}
    </div>
  );
}

export default Chat;

// frontend/src/components/NewItemPage.js

/* The provided code is a simplified and more focused version of the NewItemPage component. 
   It removes the chat functionality and concentrates on the core features of adding a new item for resale, 
   including image upload and analysis. This version is more straightforward and easier to maintain, 
   as it reduces complexity and focuses on the primary task of item submission and analysis. */

import React, { useState } from 'react';
import styled from 'styled-components';
import { analyzeImageWithGPT4Turbo } from '../api/chat';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #1a001a;
  color: #F5DEB3;
  border-radius: 10px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-top: 10px;
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #4A0E4E;
  border-radius: 5px;
  background-color: #330033;
  color: #F5DEB3;
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #4A0E4E;
  border-radius: 5px;
  background-color: #330033;
  color: #F5DEB3;
  resize: vertical;
`;

const SubmitButton = styled.button`
  margin-top: 20px;
  padding: 10px;
  background: linear-gradient(45deg, #2D0037, #4A0E4E);
  color: #F5DEB3;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1em;
  
  &:disabled {
    background: #333333;
    cursor: not-allowed;
  }
`;

const ImagePreview = styled.img`
  max-width: 200px;
  max-height: 200px;
  margin-top: 10px;
  border-radius: 10px;
`;

function NewItemPage() {
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);

    try {
      if (imageFile) {
        const messages = [
          { role: 'user', content: 'Please analyze the following item for resale.' },
          { role: 'user', content: itemDescription || itemName },
        ];
        const response = await analyzeImageWithGPT4Turbo(imageFile, messages);
        setAnalysisResult(response.assistantResponse);
      } else {
        // Handle case without image if necessary
        setAnalysisResult('No image provided for analysis.');
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Failed to analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <PageContainer>
      <h2>Add New Item for Resale</h2>
      <Form onSubmit={handleSubmit}>
        <Label htmlFor="itemName">Item Name:</Label>
        <Input
          type="text"
          id="itemName"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          required
        />

        <Label htmlFor="itemDescription">Item Description:</Label>
        <TextArea
          id="itemDescription"
          rows="4"
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder="Describe the item in detail..."
          required
        />

        <Label htmlFor="itemImage">Upload Image:</Label>
        <Input
          type="file"
          id="itemImage"
          accept="image/*"
          onChange={handleImageUpload}
        />
        {imagePreview && <ImagePreview src={imagePreview} alt="Item Preview" />}

        <SubmitButton type="submit" disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Add Item'}
        </SubmitButton>
      </Form>

      {analysisResult && (
        <div>
          <h3>Analysis Result:</h3>
          <p>{analysisResult}</p>
        </div>
      )}

      {error && (
        <div>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </PageContainer>
  );
}

export default NewItemPage;

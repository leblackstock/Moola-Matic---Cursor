// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { debounce } from 'lodash'; // Change this line
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import {
  handleChatWithAssistant,
  analyzeImageWithGPT4Turbo,
  createUserMessage,
  createAssistantMessage,
  analyzeImagesWithAssistant,
} from './api/chat.js';
import axios from 'axios';
import { UploadedImagesGallery } from './components/compGallery.js';
import PropTypes from 'prop-types';
import ChatComp from './components/compChat.js';

import {
  handleDraftSave,
  handleAutoSave,
  handleLocalSave,
  loadLocalData,
  clearLocalData,
  updateContextData,
  createDefaultItem,
  handleDraftSaveWithImages,
  updateItem as updateItemFunc,
  handleFileUpload,
  handleManualSave,
  handleNewItem,
  saveDraft,
  deleteDraft,
  fetchDrafts,
  fetchItems,
  saveToLocalStorage,
  useAutosave,
} from './components/compSave.js';
import {
  handleFileChange,
  handleImageDeletion,
} from './components/compUpload.js';

// Import all styled components
import {
  PageContainer,
  StyledHeader,
  LogoContainer,
  StaticLogo,
  StyledTitle,
  StyledSubtitle,
  StyledForm,
  StyledFormGroup,
  StyledLabel,
  StyledInput,
  StyledSelect,
  StyledTextarea,
  StyledButton,
  StyledNotification,
  GlowingButton,
  ModalOverlay,
  ModalContent,
  ModalButton,
  MainContentArea,
  ButtonContainer,
  WarningBoxOverlay,
  WarningBox,
  WarningBoxButtons,
  WarningButton,
} from './components/compStyles.js';

import {
  generateDraftFilename,
  getNextSequentialNumber,
  getImageUrl,
} from './helpers/itemGen.js';

import CombineAnalyses from './components/compCombineAnalyses.js';

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Helper functions
const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

const loadItemData = (itemId) => {
  return loadLocalData(itemId);
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

function NewItemPage({ setItemId }) {
  const { ItemId } = useParams();
  const navigate = useNavigate();

  if (ItemId === null) {
    return (
      <WarningBoxOverlay>
        <WarningBox>
          <StyledTitle>Oops! No Item Found</StyledTitle>
          <StyledSubtitle>
            It looks like we couldn't find an item to work with. Let's head back
            and start fresh!
          </StyledSubtitle>
          <WarningBoxButtons>
            <WarningButton onClick={() => navigate('/')}>
              OK, Take Me Back
            </WarningButton>
          </WarningBoxButtons>
        </WarningBox>
      </WarningBoxOverlay>
    );
  }

  // State declarations
  const [item, setItem] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contextData, setContextData] = useState({});
  const [messages, setMessages] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const backendPort = process.env.REACT_APP_BACKEND_PORT || 3001;
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageInput, setImageInput] = useState('');
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [imageAnalyzed, setImageAnalyzed] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Use the autosave hook
  const debouncedAutoSave = useAutosave(
    item,
    uploadedImages,
    messages,
    backendPort,
    setItem,
    setUploadedImages,
    setHasUnsavedChanges,
    setLastAutoSave
  );

  // ---------------------------------
  // useEffect Hook: Load or Create Item
  // ---------------------------------
  useEffect(() => {
    const loadData = async () => {
      if (!ItemId) {
        console.error('No ItemId available');
        navigate('/');
        return;
      }

      try {
        const localData = await loadLocalData(ItemId);
        // console.log('Local data loaded:', localData);

        if (localData) {
          setItem(localData);
          setName(localData.name || '');
          setDescription(localData.description || '');
          // Ensure we're setting the images array correctly
          setUploadedImages(
            Array.isArray(localData.images) ? localData.images : []
          );
          // console.log('Setting uploaded images:', localData.images || []);
          setContextData(localData.contextData || {});
          setMessages(localData.messages || []);
        } else {
          // console.log('No local data found, initializing with defaults');
          const defaultItem = createDefaultItem(ItemId);
          setItem(defaultItem);
          setName(defaultItem.name || '');
          setDescription(defaultItem.description || '');
          setUploadedImages([]);
          setContextData({});
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading local data:', error);
        const defaultItem = createDefaultItem(ItemId);
        setItem(defaultItem);
        setName(defaultItem.name || '');
        setDescription(defaultItem.description || '');
        setUploadedImages([]);
        setContextData({});
        setMessages([]);
      }
    };

    loadData();
  }, [ItemId, navigate]);

  // Optimize the loadDraft function
  const loadDraft = (draftData) => {
    if (draftData) {
      const uniqueImages = [
        ...new Map(draftData.images.map((img) => [img.filename, img])).values(),
      ];
      const updatedDraftData = {
        ...draftData,
        images: uniqueImages,
      };
      setItem(updatedDraftData);
      setUploadedImages(uniqueImages);
    }
  };

  // ----------------------------
  // useEffect Hook: Save to localStorage
  // ----------------------------
  useEffect(() => {
    if (item && ItemId) {
      handleLocalSave(item, contextData, messages, ItemId);
    }
  }, [item, contextData, messages, ItemId]);

  // ----------------------------
  // useEffect Hook: Clear localStorage on unmount
  // ----------------------------
  useEffect(() => {
    return () => {
      if (item && item.itemId) {
        handleLocalSave(item, contextData, messages);
      }
    };
  }, [item, contextData, messages]);

  // ----------------------------
  // useEffect Hook: Set Selected Image if Needed
  // ----------------------------
  useEffect(() => {
    if (uploadedImages.length > 0 && !selectedImage) {
      setSelectedImage(uploadedImages[uploadedImages.length - 1]);
    }
  }, [uploadedImages, selectedImage]);

  // Event handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting item:', item);
    // Add your submission logic here
  };

  // Handle sending messages
  const sendMessage = async () => {
    const generalInput = message.trim();
    const imageSpecificInput = imageInput.trim();

    if (!generalInput && !imageSpecificInput && !imageFile) return;

    setMessage('');
    setImageInput('');
    setIsLoading(true);

    try {
      let response;

      if (imageFile) {
        // Handle image-based messages
        const messageToSend = imageAnalyzed
          ? imageSpecificInput
          : imageAnalysisPrompt;
        const result = await analyzeImageWithGPT4Turbo(
          imageFile,
          messageToSend,
          item.itemId
        );
        response = {
          content: result.assistantResponse,
          status: 'completed',
          contextData: result.contextData,
        };

        if (!imageAnalyzed) {
          setImageAnalyzed(true);
        }
      } else {
        // Handle text-only messages
        response = await handleChatWithAssistant(
          [...messages, { role: 'user', content: generalInput }],
          item.itemId
        );
      }

      console.log('Assistant response:', response);

      // Update the UI with the new message and response
      setMessages((prevMessages) => {
        const newMessages = [
          ...prevMessages,
          {
            role: 'user',
            content: imageFile ? imageSpecificInput : generalInput,
          },
          {
            role: 'assistant',
            content: response.content,
            source: 'moola-matic',
            status: response.status,
          },
        ];
        return newMessages;
      });

      // Update contextData
      const updatedContextData = updateContextData(item.itemId, {
        lastAssistantResponse: response.content,
        lastUserMessage: imageFile ? imageSpecificInput : generalInput,
        // ... any other context updates
      });
      setContextData(updatedContextData);
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
      setIsLoading(false);
    }
  };

  // Rename this function to avoid conflict with the imported function
  const analyzeImageLocally = async (
    file,
    message,
    isInitialAnalysis = true
  ) => {
    // Convert the file to base64
    const base64Image = await fileToBase64(file);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('base64Image', base64Image); // Add base64 image
    formData.append(
      'message',
      isInitialAnalysis ? imageAnalysisPrompt : message
    );
    formData.append('isInitialAnalysis', isInitialAnalysis);
    formData.append('itemId', item.itemId);
    formData.append('contextData', JSON.stringify(contextData));

    try {
      const response = await fetch(
        `http://localhost:${backendPort}/api/analyze-images`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      // Update your local contextData with the response
      setContextData((prevContextData) => ({
        ...prevContextData,
        ...data.contextData,
      }));
      return data.advice;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  };

  const handleFileChangeWrapper = (event) => {
    handleFileChange(
      event,
      item,
      setItem,
      (newImages) => {
        console.log('Setting uploaded images:', newImages);
        setUploadedImages(Array.isArray(newImages) ? newImages : []);
      },
      setHasUnsavedChanges,
      setImageUploaded
    );
  };

  // Send Image Message
  const sendImageMessage = async () => {
    if (!imageFile || !imageInput.trim()) return;

    const newMessage = {
      content: imageInput.trim(),
      role: 'user',
      image: imagePreview,
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setIsLoading(true);

    try {
      const assistantResponse = await analyzeImageWithGPT4Turbo(
        imageFile,
        imageInput.trim(),
        false
      );

      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'user', content: imageInput.trim(), image: imagePreview },
        { role: 'assistant', content: assistantResponse },
      ]);
    } catch (error) {
      console.error('Error in sendImageMessage:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content: 'Sorry, an error occurred. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
      setImageFile(null);
      setImagePreview('');
      setImageInput('');
    }
  };

  // Remove or comment out the existing handleImageSelect function
  /*
  const handleImageSelect = async (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);

    for (const file of files) {
      try {
        const uploadedImage = await handleFileUpload(file, item.itemId);
        setUploadedImages((prevImages) => [...prevImages, uploadedImage]);
        setItem((prevItem) => ({
          ...prevItem,
          images: [...(prevItem.images || []), uploadedImage],
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Error uploading image: ${error.message}`);
      }
    }
  };
  */

  // Replace it with this simplified version that uses the existing handleFileChange function
  const handleImageSelect = (event) => {
    console.log('Image select triggered');
    console.log('Selected files:', event.target.files);
    handleFileChangeWrapper(event);
  };

  const handleImageButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCameraButtonClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleMediaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setShowImageModal(false);
  };

  const handleStartLoading = () => {
    setIsLoading(true);
  };

  const handleEndLoading = () => {
    setIsLoading(false);
  };

  const handleDeleteImageWrapper = (imageToDelete) => {
    handleImageDeletion(
      imageToDelete,
      setItem,
      setUploadedImages,
      setHasUnsavedChanges,
      backendPort,
      item // Pass the entire item object instead of draftData
    );
  };

  // Update this function to handle nested updates
  const updateItem = (field, value) => {
    setItem((prevItem) => {
      const newItem = { ...prevItem };
      const fields = field.split('.');
      let current = newItem;
      for (let i = 0; i < fields.length - 1; i++) {
        if (!current[fields[i]]) {
          current[fields[i]] = {};
        }
        current = current[fields[i]];
      }
      current[fields[fields.length - 1]] = value;
      return newItem;
    });
    setHasUnsavedChanges(true);
  };

  // Update the handleAnalyzeImages function
  const handleAnalyzeImages = async () => {
    if (uploadedImages.length === 0) {
      setNotificationMessage('Please upload at least one image to analyze.');
      setShowNotification(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const imageUrls = uploadedImages.map((image) => image.url);

      // Step 1: Collect all JSON responses
      const analysisResults = await analyzeImagesWithAssistant(
        imageUrls,
        item.description,
        item.itemId,
        item.sellerNotes,
        JSON.stringify(contextData)
      );

      console.log('Raw analysis results:', analysisResults);

      // Step 2: Use combineAnalyses to combine and summarize the results
      const combinedAnalysis = await CombineAnalyses(analysisResults);

      console.log('Combined analysis:', combinedAnalysis);

      // Step 3: Map the combined analysis to your form fields
      const mappedResult = {
        itemDetails: {
          type: combinedAnalysis.itemDetails?.type || 'Unknown',
          brand: combinedAnalysis.itemDetails?.brand || 'Unknown',
          condition: combinedAnalysis.itemDetails?.condition || 'Unknown',
          rarity: combinedAnalysis.itemDetails?.rarity || 'Unknown',
          authenticityConfirmed:
            combinedAnalysis.itemDetails?.authenticityConfirmed || null,
          packagingAccessories:
            combinedAnalysis.itemDetails?.packagingAccessories || 'None',
        },
        financials: {
          purchasePrice: combinedAnalysis.financials?.purchasePrice || 0,
          cleaningRepairCosts:
            combinedAnalysis.financials?.cleaningRepairCosts || 0,
          estimatedShippingCosts:
            combinedAnalysis.financials?.estimatedShippingCosts || 0,
          platformFees: combinedAnalysis.financials?.platformFees || 0,
          expectedProfit: combinedAnalysis.financials?.expectedProfit || 0,
          estimatedValue: combinedAnalysis.financials?.estimatedValue || 0,
        },
        marketAnalysis: {
          marketDemand:
            combinedAnalysis.marketAnalysis?.marketDemand || 'Unknown',
          historicalPriceTrends:
            combinedAnalysis.marketAnalysis?.historicalPriceTrends || 'Unknown',
          marketSaturation:
            combinedAnalysis.marketAnalysis?.marketSaturation || 'Unknown',
          salesVelocity:
            combinedAnalysis.marketAnalysis?.salesVelocity || 'Unknown',
        },
        finalRecommendation: {
          purchaseRecommendation:
            combinedAnalysis.finalRecommendation?.purchaseRecommendation ||
            'Unknown',
          detailedBreakdown:
            combinedAnalysis.finalRecommendation?.detailedBreakdown ||
            'No additional notes provided',
        },
      };

      // Update the item state with the mapped results
      setItem((prevItem) => ({
        ...prevItem,
        ...mappedResult,
      }));

      // Update messages with the analysis advice
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content: `Analysis complete. ${mappedResult.finalRecommendation.detailedBreakdown}`,
        },
      ]);
    } catch (error) {
      console.error('Error in handleAnalyzeImages:', error);
      setNotificationMessage(
        'An error occurred while analyzing the images. Please try again.'
      );
      setShowNotification(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const { newImage } = await handleFileUpload(
          file,
          backendPort,
          item,
          setUploadedImages
        );

        setItem((prevItem) => ({
          ...prevItem,
          images: [...prevItem.images, newImage],
        }));

        setImageUploaded(true);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  useEffect(() => {
    //  console.log('uploadedImages updated:', uploadedImages);
  }, [uploadedImages]);

  const handleSaveDraft = async () => {
    if (!item) {
      console.error('No item to save');
      setNotificationMessage('Error: Unable to save draft (no item data)');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    if (!ItemId) {
      console.error('Missing ItemId');
      setNotificationMessage('Error: Unable to save draft (missing ItemId)');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    try {
      console.log('Saving draft:', item);
      console.log('Messages to save:', messages);
      const savedDraft = await handleManualSave(
        item,
        uploadedImages,
        messages,
        backendPort,
        setItem,
        setUploadedImages,
        setHasUnsavedChanges,
        setLastAutoSave
      );
      console.log('Draft saved successfully:', savedDraft);
      console.log('Saved messages:', savedDraft.messages);

      setNotificationMessage('Draft saved successfully!');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error('Error saving draft:', error);
      setNotificationMessage(`Error saving draft: ${error.message}`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const handlePurchaseRecommendationChange = (value) => {
    updateItem(
      'finalRecommendation.purchaseRecommendation',
      value === 'true' ? true : value === 'false' ? false : null
    );
  };

  if (!item) {
    return <div>Loading...</div>;
  }

  //console.log('Current ItemId:', ItemId);

  return (
    <PageContainer>
      {showNotification && (
        <StyledNotification>
          {notificationMessage}
          <button onClick={() => setShowNotification(false)}>Close</button>
        </StyledNotification>
      )}

      <StyledHeader>
        <LogoContainer>
          <StaticLogo src={treasureSpecs} alt="Treasure Specs" />
        </LogoContainer>
        <StyledTitle>Add Your Thrifty Find</StyledTitle>
        <StyledSubtitle>
          Ready to turn that rusty gold into shiny cash? Let's get started!
        </StyledSubtitle>
      </StyledHeader>

      <MainContentArea>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ChatComp
            item={item}
            updateItem={updateItem}
            messages={messages}
            setMessages={setMessages}
            ItemId={item?.itemId} // Use optional chaining
            onFileChange={handleFileChangeWrapper} // Add this prop
            isLoading={isLoading}
            onStartLoading={handleStartLoading}
            onEndLoading={handleEndLoading}
            imageUploaded={imageUploaded}
            setImageUploaded={setImageUploaded}
            imagePreview={imagePreview} // Pass the imagePreview to ChatComp
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />

          <ButtonContainer>
            <GlowingButton
              onClick={handleImageButtonClick}
              disabled={isLoading}
            >
              <i className="fas fa-image"></i> Add Images
            </GlowingButton>
            <GlowingButton
              onClick={handleAnalyzeImages}
              disabled={isLoading || isAnalyzing || uploadedImages.length === 0}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Images'}
            </GlowingButton>
          </ButtonContainer>

          <UploadedImagesGallery
            images={uploadedImages || []} // Ensure it's always an array
            onSelect={handleImageSelect}
            selectedImage={selectedImage}
            onDelete={handleDeleteImageWrapper}
            itemId={ItemId}
          />

          {/* Image Selection Modal */}
          {showImageModal && (
            <ModalOverlay onClick={() => setShowImageModal(false)}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <h2>Add Images</h2>
                <p>Choose how you'd like to add images:</p>
                <ModalButton onClick={handleCameraClick}>
                  <i className="fas fa-camera"></i> Camera
                </ModalButton>
                <ModalButton onClick={handleMediaClick}>
                  <i className="fas fa-folder-open"></i> Media
                </ModalButton>
              </ModalContent>
            </ModalOverlay>
          )}

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept="image/*"
            onChange={(e) => {
              handleFileChange(setUploadedImages, ItemId)(e);
            }}
          />

          <input
            type="file"
            id="images"
            multiple
            accept="image/*"
            onChange={(e) => {
              handleFileChange(setUploadedImages, ItemId)(e);
            }}
          />

          <StyledForm onSubmit={handleSubmit}>
            {/* Basic item information */}
            <StyledFormGroup>
              <StyledLabel htmlFor="name">Item Name</StyledLabel>
              <StyledInput
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="description">Description</StyledLabel>
              <StyledTextarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="category">Category</StyledLabel>
              <StyledInput
                type="text"
                id="category"
                value={item.category || ''}
                onChange={(e) => updateItem('category', e.target.value)}
              />
            </StyledFormGroup>

            {/* Item details */}
            <StyledFormGroup>
              <StyledLabel htmlFor="itemType">Item Type</StyledLabel>
              <StyledInput
                type="text"
                id="itemType"
                value={item.itemDetails?.type || ''}
                onChange={(e) => updateItem('itemDetails.type', e.target.value)}
                required
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="brand">Brand</StyledLabel>
              <StyledInput
                type="text"
                id="brand"
                value={item.itemDetails?.brand || ''}
                onChange={(e) =>
                  updateItem('itemDetails.brand', e.target.value)
                }
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="condition">Condition</StyledLabel>
              <StyledSelect
                id="condition"
                value={item.itemDetails?.condition || ''}
                onChange={(e) =>
                  updateItem('itemDetails.condition', e.target.value)
                }
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </StyledSelect>
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="rarity">Rarity</StyledLabel>
              <StyledInput
                type="text"
                id="rarity"
                value={item.itemDetails?.rarity || ''}
                onChange={(e) =>
                  updateItem('itemDetails.rarity', e.target.value)
                }
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="authenticityConfirmed">
                Authenticity Confirmed
              </StyledLabel>
              <StyledInput
                type="checkbox"
                id="authenticityConfirmed"
                checked={item.itemDetails?.authenticityConfirmed || false}
                onChange={(e) =>
                  updateItem(
                    'itemDetails.authenticityConfirmed',
                    e.target.checked
                  )
                }
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="packagingAccessories">
                Packaging/Accessories
              </StyledLabel>
              <StyledInput
                type="text"
                id="packagingAccessories"
                value={item.itemDetails?.packagingAccessories || ''}
                onChange={(e) =>
                  updateItem('itemDetails.packagingAccessories', e.target.value)
                }
              />
            </StyledFormGroup>

            {/* Dates */}
            <StyledFormGroup>
              <StyledLabel htmlFor="purchaseDate">Purchase Date</StyledLabel>
              <StyledInput
                type="date"
                id="purchaseDate"
                value={item.purchaseDate ? item.purchaseDate.split('T')[0] : ''}
                onChange={(e) => updateItem('purchaseDate', e.target.value)}
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="listingDate">Listing Date</StyledLabel>
              <StyledInput
                type="date"
                id="listingDate"
                value={item.listingDate ? item.listingDate.split('T')[0] : ''}
                onChange={(e) => updateItem('listingDate', e.target.value)}
              />
            </StyledFormGroup>

            {/* Financial information */}
            <StyledFormGroup>
              <StyledLabel htmlFor="purchasePrice">Purchase Price</StyledLabel>
              <StyledInput
                type="number"
                id="purchasePrice"
                value={item.financials?.purchasePrice || ''}
                onChange={(e) =>
                  updateItem(
                    'financials.purchasePrice',
                    parseFloat(e.target.value)
                  )
                }
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="cleaningRepairCosts">
                Cleaning/Repair Costs
              </StyledLabel>
              <StyledInput
                type="number"
                id="cleaningRepairCosts"
                value={item.financials?.cleaningRepairCosts || ''}
                onChange={(e) =>
                  updateItem(
                    'financials.cleaningRepairCosts',
                    parseFloat(e.target.value)
                  )
                }
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="estimatedShippingCosts">
                Estimated Shipping Costs
              </StyledLabel>
              <StyledInput
                type="number"
                id="estimatedShippingCosts"
                value={item.financials?.estimatedShippingCosts || ''}
                onChange={(e) =>
                  updateItem(
                    'financials.estimatedShippingCosts',
                    parseFloat(e.target.value)
                  )
                }
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="platformFees">Platform Fees</StyledLabel>
              <StyledInput
                type="number"
                id="platformFees"
                value={item.financials?.platformFees || ''}
                onChange={(e) =>
                  updateItem(
                    'financials.platformFees',
                    parseFloat(e.target.value)
                  )
                }
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="expectedProfit">
                Expected Profit
              </StyledLabel>
              <StyledInput
                type="number"
                id="expectedProfit"
                value={item.financials?.expectedProfit || ''}
                onChange={(e) =>
                  updateItem(
                    'financials.expectedProfit',
                    parseFloat(e.target.value)
                  )
                }
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="estimatedValue">
                Estimated Value
              </StyledLabel>
              <StyledInput
                type="number"
                id="estimatedValue"
                value={item.financials?.estimatedValue || ''}
                onChange={(e) =>
                  updateItem(
                    'financials.estimatedValue',
                    parseFloat(e.target.value)
                  )
                }
              />
            </StyledFormGroup>

            {/* Additional information */}
            <StyledFormGroup>
              <StyledLabel htmlFor="sellerNotes">Seller Notes</StyledLabel>
              <StyledTextarea
                id="sellerNotes"
                value={item.sellerNotes || ''}
                onChange={(e) => updateItem('sellerNotes', e.target.value)}
                rows="3"
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="purchaseRecommendation">
                Purchase Recommendation
              </StyledLabel>
              <StyledSelect
                id="purchaseRecommendation"
                value={
                  item.finalRecommendation?.purchaseRecommendation ?? 'Unknown'
                }
                onChange={(e) =>
                  handlePurchaseRecommendationChange(e.target.value)
                }
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
                <option value="Unknown">Unknown</option>
              </StyledSelect>
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="detailedBreakdown">
                Detailed Breakdown
              </StyledLabel>
              <StyledTextarea
                id="detailedBreakdown"
                value={item.finalRecommendation?.detailedBreakdown || ''}
                readOnly
                rows="5"
              />
            </StyledFormGroup>

            <StyledButton type="submit">Save Item</StyledButton>
          </StyledForm>

          <StyledButton onClick={handleSaveDraft}>Save Draft</StyledButton>

          {lastAutoSave && (
            <p>Last auto-save: {lastAutoSave.toLocaleTimeString()}</p>
          )}

          {hasUnsavedChanges && <span>Unsaved changes</span>}
        </div>
      </MainContentArea>
    </PageContainer>
  );
}

NewItemPage.propTypes = {
  setItemId: PropTypes.func.isRequired,
};

export default NewItemPage;

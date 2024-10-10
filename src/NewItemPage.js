// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef } from 'react';
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
import { generateDraftFilename } from './components/compSave.js';
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
} from './components/compStyles.js';

// Helper functions
const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const loadItemData = (itemId) => {
  return loadLocalData(itemId);
};

function NewItemPage({ setMostRecentItemId, currentItemId }) {
  const { itemId } = useParams();
  const navigate = useNavigate();

  // ----------------------------
  // Unconditionally declare Hooks
  // ----------------------------
  const [item, setItem] = useState(null);
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
  const [imageAnalysisPrompt, setImageAnalysisPrompt] = useState('');
  const [isPromptLoaded, setIsPromptLoaded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [imageURL, setImageURL] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Use the autosave hook
  const debouncedAutoSave = useAutosave(
    item,
    uploadedImages,
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
    console.log('NewItemPage useEffect triggered with itemId:', itemId);
    const loadedData = loadLocalData(itemId);
    console.log('Loaded data from local storage:', loadedData);
    if (loadedData && loadedData.item) {
      console.log('Setting item state with loaded data:', loadedData.item);
      setItem(loadedData.item);
      console.log('Setting uploaded images:', loadedData.item.images || []);
      setUploadedImages(loadedData.item.images || []);
      setContextData(loadedData.contextData || {});
      setMessages(loadedData.messages || []);
    } else {
      console.log('Creating new item with ID:', itemId);
      const newItem = createDefaultItem(itemId);
      console.log('New item created:', newItem);
      setItem(newItem);
      setUploadedImages([]);
    }

    // Fetch the image analysis prompt
    const fetchImageAnalysisPrompt = async () => {
      try {
        const response = await axios.get(
          `http://localhost:${backendPort}/api/image-analysis-prompt`
        );
        setImageAnalysisPrompt(response.data.IMAGE_ANALYSIS_PROMPT);
      } catch (error) {
        console.error('Error fetching image analysis prompt:', error);
      }
    };

    fetchImageAnalysisPrompt();
  }, [itemId, backendPort]);

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
    if (item) {
      handleLocalSave(item, contextData, messages);
    }
  }, [item, contextData, messages]);

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
  // useEffect Hook: Fetch Image Analysis Prompt
  // ----------------------------
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
        `http://localhost:${backendPort}/api/analyze-image`,
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

  // Helper function to convert File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  // Optimize the handleFileChange function
  const handleFileChange = async (event) => {
    console.log('handleFileChange called');
    const files = event.target.files;
    if (files && files.length > 0 && item.itemId) {
      try {
        console.log('Processing files:', files.length);
        const existingFilenames = new Set(
          item.images?.map((img) => img.filename) || []
        );
        const newImages = await Promise.all(
          Array.from(files).map(async (file) => {
            try {
              console.log('Uploading file:', file.name);
              const uploadedImage = await handleFileUpload(file, item.itemId);
              console.log('Upload result:', uploadedImage);
              return uploadedImage &&
                !existingFilenames.has(uploadedImage.filename)
                ? uploadedImage
                : null;
            } catch (error) {
              console.error(`Error uploading file ${file.name}:`, error);
              return null;
            }
          })
        );

        const validNewImages = newImages.filter(Boolean);
        console.log('Valid new images:', validNewImages);

        if (validNewImages.length > 0) {
          setItem((prevItem) => ({
            ...prevItem,
            images: [...(prevItem.images || []), ...validNewImages],
          }));
          setUploadedImages((prevImages) => [...prevImages, ...validNewImages]);
          setHasUnsavedChanges(true);
          setImageUploaded(true);
        }
      } catch (error) {
        console.error('Error processing images:', error);
      }
    }
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
    handleFileChange(event);
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

  const updateItem = (field, value) => {
    setItem((prevItem) => {
      const updatedItem = { ...prevItem, [field]: value };
      handleLocalSave(updatedItem, contextData, messages);
      setHasUnsavedChanges(true);
      debouncedAutoSave(updatedItem, uploadedImages);
      return updatedItem;
    });
  };

  // Add this new function to handle image analysis
  const handleAnalyzeImages = async () => {
    if (!uploadedImages.length) {
      alert('Please upload at least one image before analyzing.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      uploadedImages.forEach((image, index) => {
        formData.append('images', image.file || image.url);
      });
      formData.append('description', item.description || '');
      formData.append('itemId', item.itemId);

      const result = await analyzeImagesWithAssistant(formData);

      updateItem({
        ...result.item,
        itemId: item.itemId,
      });

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content: result.advice,
          source: 'moola-matic',
          status: 'completed',
        },
      ]);
    } catch (error) {
      console.error('Error analyzing images:', error);
      alert('An error occurred while analyzing the images. Please try again.');
    } finally {
      setIsLoading(false);
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

  if (!item) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer>
      {showNotification && (
        <StyledNotification>
          Item successfully saved as draft
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
            currentItemId={item?.itemId} // Use optional chaining
            onFileChange={handleFileChange} // Add this prop
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
              disabled={isLoading || uploadedImages.length === 0}
            >
              <i className="fas fa-search"></i> Analyze Images
            </GlowingButton>
          </ButtonContainer>

          <UploadedImagesGallery
            images={uploadedImages}
            onSelect={handleImageSelect}
            selectedImage={selectedImage}
            onDelete={handleDeleteImageWrapper}
            itemId={item.itemId}
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
            ref={cameraInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            multiple // Add this attribute
          />

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />

          <StyledForm onSubmit={handleSubmit}>
            {/* Basic item information */}
            <StyledFormGroup>
              <StyledLabel htmlFor="name">Item Name</StyledLabel>
              <StyledInput
                type="text"
                id="name"
                value={item.name || ''}
                onChange={(e) => updateItem('name', e.target.value)}
                required
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="description">Description</StyledLabel>
              <StyledTextarea
                id="description"
                value={item.description || ''}
                onChange={(e) => updateItem('description', e.target.value)}
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

            <StyledButton type="submit">Save Item</StyledButton>
          </StyledForm>

          <StyledButton
            onClick={() => {
              if (item && item.itemId) {
                debouncedAutoSave(item, uploadedImages);
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000); // Hide notification after 3 seconds
              } else {
                console.error('Cannot save: item or itemId is missing');
              }
            }}
          >
            Save Draft
          </StyledButton>

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
  setMostRecentItemId: PropTypes.func.isRequired,
  currentItemId: PropTypes.string,
};

export default NewItemPage;

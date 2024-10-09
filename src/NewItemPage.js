// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import {
  handleChatWithAssistant,
  analyzeImageWithGPT4Turbo,
  createUserMessage,
  createAssistantMessage,
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
  updateItem,
  handleFileUpload,
  handleManualSave,
  handleNewItem,
  saveDraft,
  deleteDraft,
  fetchDrafts,
  fetchItems,
  saveToLocalStorage,
} from './components/compSave.js';

// Import all styled components
import {
  PageContainer,
  StyledHeader,
  LogoContainer,
  StaticLogo, // Add this import
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
  ButtonContainer, // Add this import
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

function generateDraftImageName(itemId, index) {
  const last6 = itemId.slice(-6);
  const paddedIndex = String(index + 1).padStart(2, '0');
  return `Draft-${last6}-${paddedIndex}`;
}

function NewItemPage({ setMostRecentItemId, currentItemId }) {
  console.log('NewItemPage: Component rendered');
  const { itemId } = useParams();
  const navigate = useNavigate();

  console.log('NewItemPage: itemId from params:', itemId);
  console.log('NewItemPage: currentItemId prop:', currentItemId);

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

  console.log(
    'NewItemPage: Rendered with itemId from params:',
    itemId,
    'and currentItemId prop:',
    currentItemId
  );

  // ---------------------------------
  // useEffect Hook: Load or Create Item
  // ---------------------------------
  useEffect(() => {
    console.log('NewItemPage: useEffect triggered');
    console.log('NewItemPage: Current itemId:', itemId);
    
    const loadedData = loadItemData(itemId);
    console.log('NewItemPage: Loaded data:', loadedData);
    
    if (loadedData && loadedData.item) {
      console.log('NewItemPage: Loading existing draft');
      setItem(loadedData.item);
      setContextData(loadedData.contextData || {});
      setMessages(loadedData.messages || []);
    } else {
      console.log('NewItemPage: Creating new item');
      const newItem = createDefaultItem(itemId);
      console.log('NewItemPage: New item created:', newItem);
      setItem(newItem);
    }

    // Fetch the image analysis prompt
    const fetchImageAnalysisPrompt = async () => {
      try {
        const response = await axios.get(`http://localhost:${backendPort}/api/image-analysis-prompt`);
        setImageAnalysisPrompt(response.data.IMAGE_ANALYSIS_PROMPT);
      } catch (error) {
        console.error('Error fetching image analysis prompt:', error);
      }
    };

    fetchImageAnalysisPrompt();
  }, [itemId, backendPort]);

  // Add this new function to handle loading drafts with deduplication
  const loadDraft = (draftData) => {
    if (draftData) {
      console.log('Loading draft:', draftData);
      // Use a Set to keep track of unique filenames
      const uniqueFilenames = new Set();
      const uniqueImages = [];

      // Add images to the uniqueImages array only if their filename is not already in the Set
      draftData.images.forEach(img => {
        if (!uniqueFilenames.has(img.filename)) {
          uniqueFilenames.add(img.filename);
          uniqueImages.push(img);
        }
      });

      // Update the draft data with unique images
      const updatedDraftData = {
        ...draftData,
        images: uniqueImages
      };

      console.log('Setting item state with:', updatedDraftData);
      setItem(updatedDraftData);
      setUploadedImages(uniqueImages);
    } else {
      console.log('No draft data to load');
    }
  };

  // ----------------------------
  // useEffect Hook: Auto-Save
  // ----------------------------
  useEffect(() => {
    const autoSave = () => {
      console.log('Auto-save triggered');
      console.log('Current item state:', item);
      console.log('Current uploadedImages:', uploadedImages);

      if (item) {
        const dataToSave = {
          ...item,
          images: uploadedImages
        };

        console.log('Data to be auto-saved:', dataToSave);

        handleAutoSave(
          dataToSave,
          uploadedImages,
          backendPort,
          setItem,
          setUploadedImages,
          setHasUnsavedChanges,
          setLastAutoSave,
          (savedData) => {
            console.log('Auto-save successful', savedData);
          },
          (error) => {
            console.error('Error auto-saving:', error);
          }
        );
      }
    };

    // Set up auto-save interval
    const autoSaveInterval = setInterval(autoSave, 60000); // Auto-save every minute

    return () => clearInterval(autoSaveInterval);
  }, [item, uploadedImages, backendPort]);

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
        console.log(
          'NewItemPage: Cleanup - Clearing local data for itemId:',
          item.itemId
        );
        clearLocalData(item.itemId);
      }
    };
  }, [item]);

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
        console.log(
          'Fetched IMAGE_ANALYSIS_PROMPT:',
          data.IMAGE_ANALYSIS_PROMPT
        );
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

  // ----------------------------
  // useEffect Hook: item state changed
  // ----------------------------
  useEffect(() => {
    console.log('NewItemPage: item state changed:', item);
  }, [item]);

  // ----------------------------
  // useEffect Hook: itemId changed
  // ----------------------------
  useEffect(() => {
    console.log('NewItemPage: itemId changed:', itemId);
  }, [itemId]);

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

  // Update the handleFileChange function to use the renamed function
  const handleFileChange = async (event) => {
    console.log('handleFileChange called');
    const files = event.target.files;
    if (files && files.length > 0) {
      const image = files[0];
      console.log('Image file selected:', image.name);
      console.log('Current itemId:', item.itemId);

      if (!item.itemId) {
        console.error('Error: itemId is undefined');
        return;
      }

      try {
        const { newImage, response } = await handleFileUpload(
          image,
          backendPort,
          item
        );

        console.log('New image object:', newImage);

        // Update uploaded images and set the new image as selected
        setUploadedImages((prevImages) => {
          const updatedImages = [...prevImages, newImage];
          setSelectedImage(newImage); // Set the newly uploaded image as selected
          return updatedImages;
        });

        setHasUnsavedChanges(true);

        // Image analysis code
        setIsLoading(true);
        try {
          console.log('Starting image analysis');
          const assistantResponse = await analyzeImageLocally(
            image,
            imageAnalysisPrompt,
            true
          );
          console.log('Received response from analyzeImageLocally');

          setMessages((prevMessages) => [
            ...prevMessages,
            { role: 'user', content: 'Image uploaded', image: imageURL },
            { role: 'assistant', content: assistantResponse },
          ]);
          setImageAnalyzed(true);
        } catch (error) {
          console.error('Error analyzing image:', error);
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: 'user', content: 'Image upload failed', image: imageURL },
            {
              role: 'assistant',
              content:
                'Sorry, an error occurred while analyzing the image. Please try again.',
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        if (error.response) {
          console.error('Server responded with:', error.response.data);
        }
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

  // Handle Image Selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      // You might want to add more logic here, like updating the item state
    }
  };

  // Additional Handlers
  const handleImageButtonClick = () => {
    setShowImageModal(true);
  };

  const handleCameraClick = () => {
    cameraInputRef.current.click();
    setShowImageModal(false);
  };

  const handleMediaClick = () => {
    fileInputRef.current.click();
    setShowImageModal(false);
  };

  const handleStartLoading = () => {
    setIsLoading(true);
  };

  const handleEndLoading = () => {
    setIsLoading(false);
  };

  const handleDeleteImage = (imageToDelete) => {
    setUploadedImages((prevImages) =>
      prevImages.filter((img) => img.id !== imageToDelete.id)
    );
  };

  const updateItem = (field, value) => {
    console.log('updateItem called with:', { field, value });
    console.log('Current item state before update:', item);
    setItem(prevItem => {
      const updatedItem = {
        ...prevItem,
        [field]: value
      };
      console.log('Updated item:', updatedItem);
      handleLocalSave(updatedItem, contextData, messages);
      return updatedItem;
    });
    setHasUnsavedChanges(true);
  };

  console.log('NewItemPage: Current item state:', item);

  console.log('NewItemPage: Rendering. Current item state:', item);

  if (!item) {
    console.log('NewItemPage: Item is null, rendering loading state');
    return <div>Loading...</div>;
  }

  console.log('NewItemPage: Item is not null, rendering full component');

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
              disabled={!isPromptLoaded || isLoading}
            >
              <i className="fas fa-image"></i> Add Images
            </GlowingButton>
          </ButtonContainer>

          <UploadedImagesGallery
            images={uploadedImages}
            onSelect={setSelectedImage}
            selectedImage={selectedImage}
            onDelete={handleDeleteImage}
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
          />

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
          />

          <StyledForm onSubmit={handleSubmit}>
            <StyledFormGroup>
              <StyledLabel htmlFor="itemName">Item Name</StyledLabel>
              <StyledInput
                type="text"
                id="itemName"
                value={item?.name || ''}
                onChange={(e) => updateItem('name', e.target.value)}
                required
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="brand">Brand</StyledLabel>
              <StyledInput
                type="text"
                id="brand"
                value={item?.brand || ''}
                onChange={(e) => updateItem('brand', e.target.value)}
              />
            </StyledFormGroup>

            <StyledFormGroup>
              <StyledLabel htmlFor="condition">Condition</StyledLabel>
              <StyledSelect
                id="condition"
                value={item?.condition || ''}
                onChange={(e) => updateItem('condition', e.target.value)}
                required
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
              <StyledLabel htmlFor="description">Description</StyledLabel>
              <StyledTextarea
                id="description"
                rows="3"
                value={item?.description || ''}
                onChange={(e) => updateItem('description', e.target.value)}
              ></StyledTextarea>
            </StyledFormGroup>

            {/* Continue with the rest of your form fields using the styled components... */}

            <StyledButton type="submit">Evaluate Item</StyledButton>
          </StyledForm>

          <StyledButton
            onClick={() => {
              console.log('Save Draft button clicked');
              console.log('Current item state:', item);
              console.log('Current uploadedImages:', uploadedImages);
              handleManualSave(
                item,
                uploadedImages,
                backendPort,
                setItem,
                setUploadedImages,
                setHasUnsavedChanges,
                setLastAutoSave
              ).then(() => {
                console.log('Manual save completed');
                console.log('Updated item state:', item);
                console.log('Updated uploadedImages:', uploadedImages);
              }).catch(error => {
                console.error('Error in manual save:', error);
              });
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
// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import {
  handleChatWithAssistant,
  createUserMessage,
  handleAnalyzeImages, // Add this line
} from './api/chat.js';
import axios from 'axios';
import { UploadedImagesGallery } from './components/compGallery.js';
import PropTypes from 'prop-types';
import ChatComp from './components/compChat.js';
import FormFields from './components/compFormFields.js';

import {
  handleLocalSave,
  loadLocalData,
  updateItem as updateItemFunc,
  handleFileUpload,
  handleManualSave,
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

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const loadItemData = (itemId) => {
  return loadLocalData(itemId);
};

function NewItemPage({ setItem: setParentItem }) {
  const { itemId } = useParams();
  const navigate = useNavigate();

  // Add a state variable for item
  const [item, setItem] = useState(null);

  // State declarations
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
  const debouncedAutosave = useAutosave(itemId, setItem, setLastAutoSave);

  // Effect for autosave
  useEffect(() => {
    if (item && itemId) {
      const autosaveData = {
        ...item,
        images: uploadedImages,
        messages: messages,
        contextData: contextData,
      };
      debouncedAutosave(autosaveData);
    }
  }, [item, itemId, uploadedImages, messages, contextData, debouncedAutosave]);

  // ---------------------------------
  // useEffect Hook: Load or Create Item
  // ---------------------------------
  useEffect(() => {
    const loadData = async () => {
      if (!itemId) {
        console.error('No itemId available in URL');
        navigate('/');
        return;
      }

      try {
        const localData = await loadLocalData(itemId);

        if (localData) {
          setItem(localData);
          setParentItem(localData);
          setUploadedImages(
            Array.isArray(localData.images) ? localData.images : []
          );
          setContextData(localData.contextData || {});
          setMessages(localData.messages || []);
        } else {
          console.error('No local data found for itemId:', itemId);
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error loading local data:', error);
        navigate('/');
      }
    };

    loadData();
  }, [itemId, navigate, setParentItem]);

  // Update item in parent component when local item changes
  useEffect(() => {
    if (item) {
      setParentItem(item);
    }
  }, [item, setParentItem]);

  // Second useEffect - Log item changes
  useEffect(() => {}, [item]);

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
    if (item && itemId) {
      handleLocalSave(item, contextData, messages, itemId);
    }
  }, [item, contextData, messages, itemId]);

  // ----------------------------
  // useEffect Hook: Clear localStorage on unmount
  // ----------------------------
  useEffect(() => {
    return () => {
      if (item && itemId) {
        handleLocalSave(item, contextData, messages, itemId);
      }
    };
  }, [item, contextData, messages, itemId]);

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
  // const sendMessage = async () => {
  //   const generalInput = message.trim();
  //   const imageSpecificInput = imageInput.trim();

  //   if (!generalInput && !imageSpecificInput && !imageFile) return;

  //   setMessage('');
  //   setImageInput('');
  //   setIsLoading(true);

  //   try {
  //     let response;

  //     if (imageFile) {
  //       // Handle image-based messages
  //       const messageToSend = imageAnalyzed
  //         ? imageSpecificInput
  //         : imageAnalysisPrompt;
  //       const result = await analyzeImageWithGPT4Turbo(
  //         imageFile,
  //         messageToSend,
  //         item.itemId
  //       );
  //       response = {
  //         content: result.assistantResponse,
  //         status: 'completed',
  //         contextData: result.contextData,
  //       };

  //       if (!imageAnalyzed) {
  //         setImageAnalyzed(true);
  //       }
  //     } else {
  //       // Handle text-only messages
  //       response = await handleChatWithAssistant(
  //         [...messages, { role: 'user', content: generalInput }],
  //         item.itemId
  //       );
  //     }

  //     console.log('Assistant response:', response);

  //     // Update the UI with the new message and response
  //     setMessages((prevMessages) => {
  //       const newMessages = [
  //         ...prevMessages,
  //         {
  //           role: 'user',
  //           content: imageFile ? imageSpecificInput : generalInput,
  //         },
  //         {
  //           role: 'assistant',
  //           content: response.content,
  //           source: 'moola-matic',
  //           status: response.status,
  //         },
  //       ];
  //       return newMessages;
  //     });

  //     // Update contextData
  //     const updatedContextData = updateContextData(item.itemId, {
  //       lastAssistantResponse: response.content,
  //       lastUserMessage: imageFile ? imageSpecificInput : generalInput,
  //       // ... any other context updates
  //     });
  //     setContextData(updatedContextData);
  //   } catch (error) {
  //     console.error('Error interacting with Moola-Matic assistant:', error);
  //     setMessages((prevMessages) => [
  //       ...prevMessages,
  //       {
  //         role: 'assistant',
  //         content:
  //           'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.',
  //       },
  //     ]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleFileChangeWrapper = (event) => {
    handleFileChange(
      event,
      itemId,
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
  // const sendImageMessage = async () => {
  //   if (!imageFile || !imageInput.trim()) return;

  //   const newMessage = {
  //     content: imageInput.trim(),
  //     role: 'user',
  //     image: imagePreview,
  //   };

  //   setMessages((prevMessages) => [...prevMessages, newMessage]);
  //   setIsLoading(true);

  //   try {
  //     const assistantResponse = await analyzeImageWithGPT4Turbo(
  //       imageFile,
  //       imageInput.trim(),
  //       false
  //     );

  //     setMessages((prevMessages) => [
  //       ...prevMessages,
  //       { role: 'user', content: imageInput.trim(), image: imagePreview },
  //       { role: 'assistant', content: assistantResponse },
  //     ]);
  //   } catch (error) {
  //     console.error('Error in sendImageMessage:', error);
  //     setMessages((prevMessages) => [
  //       ...prevMessages,
  //       {
  //         role: 'assistant',
  //         content: 'Sorry, an error occurred. Please try again.',
  //       },
  //     ]);
  //   } finally {
  //     setIsLoading(false);
  //     setImageFile(null);
  //     setImagePreview('');
  //     setImageInput('');
  //   }
  // };

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

  // Update the updateItem function to handle nested properties
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
  const handleAnalyzeImagesWrapper = async () => {
    setIsAnalyzing(true);
    setIsLoading(true);
    try {
      console.log('Starting image analysis...');
      const result = await handleAnalyzeImages({
        uploadedImages,
        item,
        contextData,
        setItem,
        setMessages,
        setNotificationMessage,
        setShowNotification,
      });

      console.log('Analysis result:', result);

      if (result && typeof result === 'object') {
        setItem((prevItem) => ({
          ...prevItem,
          analysisResult: result,
        }));
        setNotificationMessage('Image analysis completed successfully!');
        setShowNotification(true);
      } else {
        console.error('Invalid analysis result:', result);
        setNotificationMessage('Error: Invalid analysis result');
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error in handleAnalyzeImagesWrapper:', error);
      setNotificationMessage('Error analyzing images. Please try again.');
      setShowNotification(true);
    } finally {
      setIsAnalyzing(false);
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
          itemId, // Use itemId here instead of item
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
    if (!item || !itemId) {
      console.error('No item to save or missing itemId');
      setNotificationMessage('Error: Unable to save draft');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    try {
      console.log('Saving draft:', item);
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

  // Render a loading state if item is not yet loaded
  if (!item) {
    return <div>Loading...</div>;
  }

  //console.log('Current itemId:', itemId);

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
            itemId={itemId}
            onFileChange={handleFileChangeWrapper}
            isLoading={isLoading}
            onStartLoading={handleStartLoading}
            onEndLoading={handleEndLoading}
            imageUploaded={imageUploaded}
            setImageUploaded={setImageUploaded}
            imagePreview={imagePreview}
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
              onClick={handleAnalyzeImagesWrapper}
              disabled={isLoading || isAnalyzing || uploadedImages.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Analyzing...
                </>
              ) : (
                'Analyze Images'
              )}
            </GlowingButton>
          </ButtonContainer>

          <UploadedImagesGallery
            images={uploadedImages || []}
            onSelect={handleImageSelect}
            selectedImage={selectedImage}
            onDelete={handleDeleteImageWrapper}
            itemId={itemId}
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

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept="image/*"
            onChange={(e) => {
              handleFileChange(setUploadedImages, itemId)(e);
            }}
          />

          {/* New Save Draft button */}
          <StyledButton onClick={handleSaveDraft}>Save Draft</StyledButton>

          {lastAutoSave && (
            <p>Last auto-save: {lastAutoSave.toLocaleTimeString()}</p>
          )}

          {hasUnsavedChanges && <span>Unsaved changes</span>}

          {/* Update FormFields component to include all relevant fields from the DraftItem schema */}
          <FormFields
            item={item}
            updateItem={updateItem}
            handleSubmit={handleSubmit}
            handleSaveDraft={handleSaveDraft}
            handlePurchaseRecommendationChange={
              handlePurchaseRecommendationChange
            }
            itemId={itemId} // Add this line
          />
        </div>
      </MainContentArea>
    </PageContainer>
  );
}

NewItemPage.propTypes = {
  setItem: PropTypes.func.isRequired,
};

export default NewItemPage;

// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  handleImageDelete, // Add this line
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
import { toast } from 'react-toastify';

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const loadItemData = (itemId) => {
  return loadLocalData(itemId);
};

function NewItemPage({ setItem: setParentItem }) {
  console.log('NewItemPage render start');

  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [isLoading, setIsLoading] = useState(true);
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
  const [galleryKey, setGalleryKey] = useState(0);

  // Add this state for AI recommendation
  const [aiRecommendation, setAiRecommendation] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);

  // Use the autosave hook with a 10-second interval
  const updateAutosaveData = useAutosave(
    itemId,
    setItem,
    setLastAutoSave,
    10000,
    60000,
    isUploading
  );

  // Effect for autosave
  useEffect(() => {
    console.log('Autosave effect triggered');
    if (item && itemId) {
      console.log('Preparing autosave data');
      const autosaveData = {
        ...item,
        images: uploadedImages,
        messages: messages,
        contextData: contextData,
      };
      updateAutosaveData(autosaveData);
    }
  }, [item, itemId, uploadedImages, messages, contextData, updateAutosaveData]);

  // ---------------------------------
  // useEffect Hook: Load or Create Item
  // ---------------------------------
  useEffect(() => {
    console.log('Load or Create Item effect triggered');
    const loadData = async () => {
      if (!itemId || !location.pathname.includes(`/new-item/${itemId}`)) {
        console.error('No valid itemId in URL');
        navigate('/');
        return;
      }

      try {
        const localData = await loadLocalData(itemId);

        if (localData) {
          // Load local data first
          setItem(localData);
          setParentItem(localData);
          setUploadedImages(
            Array.isArray(localData.images) ? localData.images : []
          );
          setContextData(localData.contextData || {});
          setMessages(localData.messages || []);
          setAiRecommendation(localData.finalRecommendation || null);

          // Now check the database for updates
          try {
            const response = await axios.get(
              `${API_BASE_URL}/api/items/${itemId}`
            );
            const dbItem = response.data;

            if (dbItem && dbItem.lastUpdated > localData.lastUpdated) {
              // DB data is newer, update the state
              setItem(dbItem);
              setParentItem(dbItem);
              setUploadedImages(
                Array.isArray(dbItem.images) ? dbItem.images : []
              );
              setContextData(dbItem.contextData || {});
              setMessages(dbItem.messages || []);
              setAiRecommendation(dbItem.finalRecommendation || null);

              // Update local storage with the newer data
              handleLocalSave(
                dbItem,
                dbItem.contextData,
                dbItem.messages,
                itemId
              );
            }
          } catch (dbError) {
            console.error('Error fetching item from database:', dbError);
            // Continue with local data if database fetch fails
          }
        } else {
          // If no local data, fetch from database
          try {
            const response = await axios.get(
              `${API_BASE_URL}/api/items/${itemId}`
            );
            const dbItem = response.data;
            if (dbItem) {
              setItem(dbItem);
              setParentItem(dbItem);
              setUploadedImages(
                Array.isArray(dbItem.images) ? dbItem.images : []
              );
              setContextData(dbItem.contextData || {});
              setMessages(dbItem.messages || []);
              setAiRecommendation(dbItem.finalRecommendation || null);
              // Save to local storage
              handleLocalSave(
                dbItem,
                dbItem.contextData,
                dbItem.messages,
                itemId
              );
            } else {
              console.error('No data found for itemId:', itemId);
              navigate('/');
              return;
            }
          } catch (dbError) {
            console.error('Error fetching item from database:', dbError);
            navigate('/');
            return;
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        navigate('/');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [itemId, navigate, setParentItem, location]);

  // Update item in parent component when local item changes
  useEffect(() => {
    console.log('Update parent item effect triggered');
    if (item) {
      console.log('Updating parent item');
      setParentItem(item);
    }
  }, [item, setParentItem]);

  // Log item changes
  useEffect(() => {
    console.log('Item changed:', item);
  }, [item]);

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
    console.log('Save to localStorage effect triggered');
    if (item && itemId) {
      console.log('Saving to localStorage');
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
    console.log('Set Selected Image effect triggered');
    if (uploadedImages.length > 0 && !selectedImage) {
      console.log('Setting selected image');
      setSelectedImage(uploadedImages[uploadedImages.length - 1]);
    }
  }, [uploadedImages, selectedImage]);

  // Log uploaded images changes
  useEffect(() => {
    console.log('uploadedImages state updated:', uploadedImages);
  }, [uploadedImages]);

  // Event handlers with added logging
  const handleSubmit = async (e) => {
    console.log('handleSubmit called');
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

  // New function to fetch the latest item data from the server
  const fetchLatestItemData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/items/${itemId}`);
      const serverItem = response.data;
      console.log('Fetched item data:', serverItem);
      setItem(serverItem);
      setParentItem(serverItem);
      setUploadedImages(
        Array.isArray(serverItem.images) ? serverItem.images : []
      );
      handleLocalSave(
        serverItem,
        serverItem.contextData,
        serverItem.messages,
        itemId
      );
      setGalleryKey((prevKey) => prevKey + 1);
    } catch (error) {
      console.error('Error fetching latest item data:', error);
    }
  };

  const handleFileChangeWrapper = async (event) => {
    console.log('handleFileChangeWrapper called');
    setIsUploading(true);
    try {
      const result = await handleFileChange(
        event,
        itemId,
        setItem,
        setHasUnsavedChanges,
        setImageUploaded
      );

      console.log('File change result:', result);

      if (Array.isArray(result)) {
        setUploadedImages((prevImages) => [...prevImages, ...result]);

        // Trigger manual save after images are uploaded
        await handleManualSave(
          item,
          [...uploadedImages, ...result],
          messages,
          backendPort,
          setItem,
          setUploadedImages,
          setHasUnsavedChanges,
          setLastAutoSave
        );
        toast.success('Images uploaded and saved successfully!');
      } else {
        console.error('Unexpected response format:', result);
      }
    } catch (error) {
      console.error('Error in handleFileChangeWrapper:', error);
      setNotificationMessage('Error uploading images. Please try again.');
      setShowNotification(true);
    } finally {
      setIsUploading(false);
    }
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
    console.log('handleImageSelect called');
    console.log('Selected files:', event.target.files);
    handleFileChangeWrapper(event);
  };

  const handleImageButtonClick = () => {
    console.log('handleImageButtonClick called');
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
    console.log('handleDeleteImageWrapper called', imageToDelete);
    handleImageDelete(imageToDelete, itemId, setUploadedImages, setItem);
  };

  // Update the updateItem function to handle nested properties safely
  const updateItem = (field, value) => {
    console.log('updateItem called', field, value);
    setItem((prevItem) => {
      const newItem = { ...prevItem };
      if (typeof field === 'string') {
        const fields = field.split('.');
        let current = newItem;
        for (let i = 0; i < fields.length - 1; i++) {
          if (!current[fields[i]]) {
            current[fields[i]] = {};
          }
          current = current[fields[i]];
        }
        current[fields[fields.length - 1]] = value;
      } else if (typeof field === 'object') {
        // If field is an object, assume it's a full item update
        return { ...newItem, ...field };
      } else {
        // For simple key updates
        newItem[field] = value;
      }
      return newItem;
    });
    setHasUnsavedChanges(true);
  };

  // Update handlePurchaseRecommendationChange to use the updateItem function
  const handlePurchaseRecommendationChange = (value) => {
    console.log('handlePurchaseRecommendationChange called', value);
    updateItem(
      'finalRecommendation.purchaseRecommendation',
      value === 'true' ? true : value === 'false' ? false : null
    );
  };

  // Add this useEffect to update aiRecommendation when item changes
  useEffect(() => {
    console.log('Update aiRecommendation effect triggered');
    if (item && item.finalRecommendation) {
      console.log('Updating aiRecommendation');
      setAiRecommendation(item.finalRecommendation);
    }
  }, [item]);

  // Add this state to track if an analysis has been performed
  const [analysisPerformed, setAnalysisPerformed] = useState(false);

  // Modify the handleAnalyzeImagesWrapper function
  const handleAnalyzeImagesWrapper = async () => {
    console.log('handleAnalyzeImagesWrapper called');
    setIsAnalyzing(true);
    try {
      console.log('Starting image analysis...');
      const result = await handleAnalyzeImages({
        itemId,
        contextData,
        setItem,
        setMessages,
        setNotificationMessage,
        setShowNotification,
      });

      if (result && typeof result === 'object') {
        setItem((prevItem) => ({
          ...prevItem,
          analysisResult: result,
        }));
        setAnalysisPerformed(true); // Set this to true after successful analysis
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

  const handleSaveDraft = async () => {
    console.log('handleSaveDraft called');
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

  // Render a loading state if item is not yet loaded
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!item) {
    navigate('/');
    return null;
  }

  //console.log('Current itemId:', itemId);

  console.log('NewItemPage render end');

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
              disabled={isAnalyzing}
            >
              <i className="fas fa-image"></i> Add Images
            </GlowingButton>
            <GlowingButton
              onClick={handleAnalyzeImagesWrapper}
              disabled={isAnalyzing || uploadedImages.length === 0}
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

          {isAnalyzing && (
            <div>
              <p>
                Image analysis in progress... You can continue to interact with
                other parts of the page.
              </p>
            </div>
          )}

          <UploadedImagesGallery
            key={galleryKey}
            images={uploadedImages}
            onSelect={(image) => setSelectedImage(image)}
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
            onChange={handleFileChangeWrapper}
            disabled={isUploading}
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
            itemId={itemId}
            analysisResult={analysisPerformed ? item.analysisResult : null}
            aiRecommendation={aiRecommendation}
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

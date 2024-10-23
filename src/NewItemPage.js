// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import {
  // handleChatWithAssistant,
  // createUserMessage,
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
  // handleFileUpload,
  handleManualSave,
  useAutosave,
} from './components/compSave.js';
import {
  handleFileChange,
  // handleImageDeletion,
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
  StyledButton,
  GlowingButton,
  ModalOverlay,
  ModalContent,
  ModalButton,
  MainContentArea,
  ButtonContainer,
  WarningModalButton,
  AnimatedText,
} from './components/compStyles.js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RawAnalysisSummary from './components/compRawAnalysis.js';
import AnalysisDetails from './components/compDetails.js';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// const loadItemData = itemId => {
//   return loadLocalData(itemId);
// };

// Keep this version at the top level of the file, before the NewItemPage component
const AnalysisWarningModal = ({ onConfirm, onCancel }) => {
  return (
    <ModalOverlay>
      <ModalContent>
        <h2>
          <i className="fas fa-exclamation-triangle" style={{ color: '#ffd700' }}></i> Hold Up,
          Treasure Hunter!
        </h2>
        <AnimatedText delay="0.2s">
          <i className="fas fa-magic"></i>
          You haven't added any details to help Moola-Matic understand your find. A few extra
          details can help our AI treasure expert give you even better insights about your item's
          potential value!
        </AnimatedText>
        <AnimatedText delay="0.4s">
          <i className="fas fa-question-circle"></i>
          Want to proceed without adding any extra details?
        </AnimatedText>
        <ButtonContainer>
          <WarningModalButton onClick={onConfirm}>
            <i className="fas fa-check"></i> Yes, let's analyze!
          </WarningModalButton>
          <WarningModalButton onClick={onCancel}>
            <i className="fas fa-pen"></i> No, I'll add details
          </WarningModalButton>
        </ButtonContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

AnalysisWarningModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

function NewItemPage({ onItemSaved }) {
  // Remove the console.log at the start of the function

  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Add a state variable for item
  const [item, setItem] = useState(null);

  // State declarations
  // const [name, setName] = useState('');
  // const [description, setDescription] = useState('');
  const [contextData, setContextData] = useState({});
  const [messages, setMessages] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const backendPort = process.env.REACT_APP_BACKEND_PORT || 3001;
  const [isLoading, setIsLoading] = useState(true);
  const [imageUploaded, setImageUploaded] = useState(false);
  // const [imagePreview, setImagePreview] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [message, setMessage] = useState('');
  // const [imageFile, setImageFile] = useState(null);
  // const [imageInput, setImageInput] = useState('');
  // const [imageAnalysis, setImageAnalysis] = useState(null);
  // const [imageAnalyzed, setImageAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // const [galleryKey, setGalleryKey] = useState(0);
  const [analysisTimeLeft, setAnalysisTimeLeft] = useState(0);

  const fileInputRef = useRef(null);
  // const cameraInputRef = useRef(null);
  // const messagesContainerRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);

  // Add a ref to track if this is an autosave update
  const isAutosaveUpdate = useRef(false);

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
    // console.log('Autosave effect triggered');
    if (item && itemId) {
      // console.log('Preparing autosave data');
      const autosaveData = {
        ...item,
        images: uploadedImages,
        messages: messages,
        contextData: contextData,
      };
      updateAutosaveData(autosaveData);
    }
  }, [item, itemId, uploadedImages, messages, contextData, updateAutosaveData]);

  // Memoize complex objects or functions
  // const memoizedContextData = useMemo(() => contextData, [contextData]);
  const memoizedMessages = useMemo(() => messages, [messages]);

  // Use useCallback for functions passed as props
  const memoizedUpdateItem = useCallback((field, value) => {
    // console.log('updateItem called', field, value);
    setItem(prevItem => {
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
        return { ...newItem, ...field };
      } else {
        newItem[field] = value;
      }
      return newItem;
    });
    setHasUnsavedChanges(true);
  }, []);

  // ---------------------------------
  // useEffect Hook: Load or Create Item
  // ---------------------------------
  useEffect(() => {
    // console.log('Load or Create Item effect triggered');
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
          // Remove this line: onItemSaved(localData.itemId);
          setUploadedImages(Array.isArray(localData.images) ? localData.images : []);
          setContextData(localData.contextData || {});
          setMessages(localData.messages || []);
          setIsAnalyzing(localData.isAnalyzing || false);

          // Set analysis results if available
          if (localData.analysisResults) {
            console.log('Loading analysis results from local storage:', localData.analysisResults);
            setAnalysisPerformed(true);
          }

          // Now check the database for updates
          try {
            const response = await axios.get(`${API_BASE_URL}/api/items/${itemId}`);
            const dbItem = response.data;

            if (dbItem && dbItem.lastUpdated > localData.lastUpdated) {
              // DB data is newer, update the state
              setItem(dbItem);
              onItemSaved(dbItem.itemId);
              setUploadedImages(Array.isArray(dbItem.images) ? dbItem.images : []);
              setContextData(dbItem.contextData || {});
              setMessages(dbItem.messages || []);
              setIsAnalyzing(dbItem.isAnalyzing || false);

              // Set analysis results if available in DB
              if (dbItem.analysisResults) {
                console.log('Loading analysis results from database:', dbItem.analysisResults);
                setAnalysisPerformed(true);
              }

              // Update local storage with the newer data
              handleLocalSave(dbItem, dbItem.contextData, dbItem.messages, itemId);
            }
          } catch (dbError) {
            console.error('Error fetching item from database:', dbError);
            // Continue with local data if database fetch fails
          }
        } else {
          // If no local data, fetch from database
          try {
            const response = await axios.get(`${API_BASE_URL}/api/items/${itemId}`);
            const dbItem = response.data;
            if (dbItem) {
              setItem(dbItem);
              onItemSaved(dbItem.itemId);
              setUploadedImages(Array.isArray(dbItem.images) ? dbItem.images : []);
              setContextData(dbItem.contextData || {});
              setMessages(dbItem.messages || []);
              setIsAnalyzing(dbItem.isAnalyzing || false);

              // Set analysis results if available in DB
              if (dbItem.analysisResults) {
                console.log('Loading analysis results from database:', dbItem.analysisResults);
                setAnalysisPerformed(true);
              }

              // Save to local storage
              handleLocalSave(dbItem, dbItem.contextData, dbItem.messages, itemId);
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
  }, [itemId, navigate, onItemSaved, location.pathname]);

  // Update item in parent component when local item changes
  useEffect(() => {
    // console.log('Update parent item effect triggered');
    if (item && !isAutosaveUpdate.current) {
      // console.log('Updating parent item');
      onItemSaved(item.itemId);
    }
    isAutosaveUpdate.current = false;
  }, [item, onItemSaved]);

  // Log item changes
  useEffect(() => {
    // console.log('Item changed:', item);
  }, [item]);

  // // Optimize the loadDraft function
  // const loadDraft = draftData => {
  //   if (draftData) {
  //     const uniqueImages = [...new Map(draftData.images.map(img => [img.filename, img])).values()];
  //     const updatedDraftData = {
  //       ...draftData,
  //       images: uniqueImages,
  //     };
  //     setItem(updatedDraftData);
  //     setUploadedImages(uniqueImages);
  //   }
  // };

  // ----------------------------
  // useEffect Hook: Save to localStorage
  // ----------------------------
  useEffect(() => {
    // console.log('Save to localStorage effect triggered');
    if (item && itemId) {
      // console.log('Saving to localStorage');
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
    // console.log('Set Selected Image effect triggered');
    if (uploadedImages.length > 0 && !selectedImage) {
      // console.log('Setting selected image');
      setSelectedImage(uploadedImages[uploadedImages.length - 1]);
    }
  }, [uploadedImages, selectedImage]);

  // Log uploaded images changes
  useEffect(() => {
    // console.log('uploadedImages state updated:', uploadedImages);
  }, [uploadedImages]);

  // Event handlers with added logging
  const handleSubmit = async e => {
    // console.log('handleSubmit called');
    e.preventDefault();
    // console.log('Submitting item:', item);
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
  // const fetchLatestItemData = async () => {
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/api/items/${itemId}`);
  //     const serverItem = response.data;
  //     console.log('Fetched item data:', serverItem);
  //     setItem(serverItem);
  //     setCurrentItemId(serverItem.itemId);
  //     setUploadedImages(Array.isArray(serverItem.images) ? serverItem.images : []);
  //     handleLocalSave(serverItem, serverItem.contextData, serverItem.messages, itemId);
  //     setGalleryKey(prevKey => prevKey + 1);
  //   } catch (error) {
  //     console.error('Error fetching latest item data:', error);
  //   }
  // };

  const handleFileChangeWrapper = async event => {
    // console.log('handleFileChangeWrapper called');
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
        setUploadedImages(prevImages => [...prevImages, ...result]);

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
      toast.error('Error uploading images. Please try again.');
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
  // const handleImageSelect = event => {
  //   // console.log('handleImageSelect called');
  //   // console.log('Selected files:', event.target.files);
  //   handleFileChangeWrapper(event);
  // };

  const handleImageButtonClick = () => {
    // console.log('handleImageButtonClick called');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // const handleCameraButtonClick = () => {
  //   if (cameraInputRef.current) {
  //     cameraInputRef.current.click();
  //   }
  // };

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

  const handleDeleteImageWrapper = imageToDelete => {
    // console.log('handleDeleteImageWrapper called', imageToDelete);
    handleImageDelete(imageToDelete, itemId, setUploadedImages, setItem);
  };

  // Update the updateItem function to handle nested properties safely
  const updateItem = (field, value) => {
    // console.log('updateItem called', field, value);
    setItem(prevItem => {
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
  const handlePurchaseRecommendationChange = value => {
    // console.log('handlePurchaseRecommendationChange called', value);
    updateItem(
      'finalRecommendation.purchaseRecommendation',
      value === 'true' ? true : value === 'false' ? false : null
    );
  };

  // Add this state to track if an analysis has been performed
  const [analysisPerformed, setAnalysisPerformed] = useState(false);

  // Add new state for analysis progress
  const [analysisProgress, setAnalysisProgress] = useState({
    totalImages: 0,
    completedImages: 0,
    currentImageName: '',
    intermediateResults: [],
  });

  // Add this state to track if the analysis warning modal should be shown
  const [showAnalysisWarning, setShowAnalysisWarning] = useState(false);

  // Add this state to track the analysis details
  const [analysisDetails, setAnalysisDetails] = useState('');

  // Modify handleAnalyzeImagesWrapper function
  const handleAnalyzeImagesWrapper = async () => {
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one image before analyzing.');
      return;
    }

    if (!analysisDetails.trim()) {
      setShowAnalysisWarning(true);
      return;
    }

    const estimatedTimePerImage = 20; // 20 seconds per image
    const totalEstimatedTime = uploadedImages.length * estimatedTimePerImage;

    setIsAnalyzing(true);
    setAnalysisTimeLeft(totalEstimatedTime);
    setAnalysisProgress({
      totalImages: uploadedImages.length,
      completedImages: 0,
      currentImageName: uploadedImages[0].filename,
      intermediateResults: [],
    });

    try {
      // Update the local storage and database to reflect that analysis is in progress
      const updatedItem = {
        ...item,
        isAnalyzing: true,
        analysisProgress: {
          totalImages: uploadedImages.length,
          completedImages: 0,
          currentImageName: uploadedImages[0].filename,
          intermediateResults: [],
        },
        analysisDetails: analysisDetails, // Include the analysis details
      };
      await handleLocalSave(updatedItem, contextData, messages, itemId);
      await axios.put(`${API_BASE_URL}/api/items/${itemId}`, updatedItem);

      const result = await handleAnalyzeImages({
        imageUrls: uploadedImages.map(img => img.url),
        description: item.description || '',
        itemId: itemId,
        sellerNotes: item.sellerNotes || '',
        context: contextData,
        analysisDetails: analysisDetails, // Include the analysis details
        onProgress: async (completedImages, currentImage, intermediateResult) => {
          const newProgress = {
            totalImages: uploadedImages.length,
            completedImages,
            currentImageName: currentImage,
            intermediateResults: [...analysisProgress.intermediateResults, intermediateResult],
          };
          setAnalysisProgress(newProgress);

          // Save progress to backend and local storage
          const progressItem = {
            ...item,
            isAnalyzing: true,
            analysisProgress: newProgress,
          };
          await handleLocalSave(progressItem, contextData, messages, itemId);
          await axios.put(`${API_BASE_URL}/api/items/${itemId}`, progressItem);
        },
      });

      if (result && typeof result === 'object') {
        const finalUpdatedItem = {
          ...updatedItem,
          analysisResults: result,
          isAnalyzing: false,
          analysisProgress: null, // Clear progress after completion
        };
        setItem(finalUpdatedItem);
        setAnalysisPerformed(true);
        setAnalysisProgress({
          totalImages: 0,
          completedImages: 0,
          currentImageName: '',
          intermediateResults: [],
        });

        // Update local storage and database with the final result
        await handleLocalSave(finalUpdatedItem, contextData, messages, itemId);
        await axios.put(`${API_BASE_URL}/api/items/${itemId}`, finalUpdatedItem);

        toast.success('Image analysis completed successfully!');
      } else {
        console.error('Invalid analysis result:', result);
        toast.error('Error: Invalid analysis result');
      }
    } catch (error) {
      console.error('Error in handleAnalyzeImagesWrapper:', error);
      if (error.response && error.response.status === 429) {
        toast.error(
          'OpenAI API quota exceeded. Please check your OpenAI billing and usage details.',
          { autoClose: 10000 }
        );
      } else {
        toast.error('Error analyzing images. Progress has been saved.');
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisTimeLeft(0);
    }
  };

  // Add effect to check for ongoing analysis on mount
  useEffect(() => {
    const checkOngoingAnalysis = async () => {
      if (item?.isAnalyzing && item?.analysisProgress) {
        setIsAnalyzing(true);
        setAnalysisProgress(item.analysisProgress);

        // Resume analysis from where it left off
        if (item.analysisProgress.completedImages < uploadedImages.length) {
          const remainingImages = uploadedImages.slice(item.analysisProgress.completedImages);
          if (remainingImages.length > 0) {
            toast.info('Resuming previous analysis...');
            handleAnalyzeImagesWrapper();
          }
        }
      }
    };

    checkOngoingAnalysis();
  }, [item?.isAnalyzing]);

  useEffect(() => {
    let timer;
    if (isAnalyzing && analysisTimeLeft > 0) {
      timer = setInterval(() => {
        setAnalysisTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing, analysisTimeLeft]);

  // const handleImageUpload = async event => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     try {
  //       const { newImage } = await handleFileUpload(
  //         file,
  //         backendPort,
  //         itemId, // Use itemId here instead of item
  //         setUploadedImages
  //       );

  //       setItem(prevItem => ({
  //         ...prevItem,
  //         images: [...prevItem.images, newImage],
  //       }));

  //       setImageUploaded(true);
  //       setHasUnsavedChanges(true);
  //     } catch (error) {
  //       console.error('Error uploading image:', error);
  //     }
  //   }
  // };

  const handleSaveDraft = async () => {
    // console.log('handleSaveDraft called');
    if (!item || !itemId) {
      console.error('No item to save or missing itemId');
      toast.error('Error: Unable to save draft');
      return;
    }

    try {
      // console.log('Saving draft:', item);
      await handleManualSave(
        item,
        uploadedImages,
        messages,
        backendPort,
        setItem,
        setUploadedImages,
        setHasUnsavedChanges,
        setLastAutoSave
      );
      onItemSaved(itemId); // Update this line
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error(`Error saving draft: ${error.message}`);
    }
  };

  // Add this function to your component
  const handleCameraClick = () => {
    // Implement your camera click logic here
    // console.log('Camera clicked');
  };

  // Add these handlers for the warning modal
  const handleAnalysisWarningConfirm = () => {
    setShowAnalysisWarning(false);
    // Continue with analysis even without details
    handleAnalyzeImages({
      imageUrls: uploadedImages.map(img => img.url),
      description: item.description || '',
      itemId: itemId,
      sellerNotes: item.sellerNotes || '',
      context: contextData,
      analysisDetails: '',
    });
  };

  const handleAnalysisWarningCancel = () => {
    setShowAnalysisWarning(false);
  };

  // Render a loading state if item is not yet loaded
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!item) {
    navigate('/');
    return null;
  }

  // console.log('Current itemId:', itemId);

  // Remove the console.log at the end of the function

  return (
    <PageContainer>
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
            updateItem={memoizedUpdateItem}
            messages={memoizedMessages}
            setMessages={setMessages}
            itemId={itemId}
            onFileChange={handleFileChangeWrapper}
            isLoading={isLoading}
            onStartLoading={handleStartLoading}
            onEndLoading={handleEndLoading}
            imageUploaded={imageUploaded}
            setImageUploaded={setImageUploaded}
            // imagePreview={imagePreview} // Remove or comment out this line
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />

          <ButtonContainer>
            <GlowingButton onClick={handleImageButtonClick} disabled={isAnalyzing}>
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
            <div
              style={{
                margin: '1rem 0',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
              }}
            >
              <p>
                <i className="fas fa-info-circle"></i> Image analysis in progress... You can safely
                navigate away and return later. Progress will be saved.
              </p>
              <p>
                <i className="fas fa-image"></i> Analyzing image{' '}
                {analysisProgress.completedImages + 1} of {analysisProgress.totalImages}:{' '}
                {analysisProgress.currentImageName}
              </p>
              <p>
                <i className="fas fa-clock"></i> Estimated time left:{' '}
                {Math.floor(analysisTimeLeft / 60)}:
                {(analysisTimeLeft % 60).toString().padStart(2, '0')}
              </p>
              {analysisProgress.intermediateResults.length > 0 && (
                <div>
                  <p>
                    <i className="fas fa-check-circle"></i> Completed analyses:
                  </p>
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {analysisProgress.intermediateResults.map((result, index) => (
                      <div key={index} style={{ marginLeft: '1rem', color: '#28a745' }}>
                        <i className="fas fa-check"></i> Image {index + 1}: {result.filename}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <UploadedImagesGallery
            // key={galleryKey}
            images={uploadedImages}
            onSelect={image => setSelectedImage(image)}
            selectedImage={selectedImage}
            onDelete={handleDeleteImageWrapper}
            itemId={itemId}
          />

          {/* Only render AnalysisDetails if there are uploaded images */}
          {uploadedImages.length > 0 && (
            <>
              <AnalysisDetails
                analysisDetails={analysisDetails}
                setAnalysisDetails={setAnalysisDetails}
              />
              {showAnalysisWarning && (
                <AnalysisWarningModal
                  onConfirm={handleAnalysisWarningConfirm}
                  onCancel={handleAnalysisWarningCancel}
                />
              )}
            </>
          )}

          {/* Image Selection Modal */}
          {showImageModal && (
            <ModalOverlay onClick={() => setShowImageModal(false)}>
              <ModalContent onClick={e => e.stopPropagation()}>
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

          {hasUnsavedChanges && <span>Unsaved changes</span>}

          {/* Always render FormFields */}
          <FormFields
            item={item}
            updateItem={memoizedUpdateItem}
            handleSubmit={handleSubmit}
            handleSaveDraft={handleSaveDraft}
            handlePurchaseRecommendationChange={handlePurchaseRecommendationChange}
            itemId={itemId}
            analysisResult={item.analysisResults}
            lastAutoSave={lastAutoSave} // Add this prop
          />

          {/* Render RawAnalysisSummary only if analysis is performed */}
          {analysisPerformed && item && item.analysisResults && (
            <RawAnalysisSummary rawAnalysis={item.analysisResults.summary} />
          )}
        </div>
      </MainContentArea>
    </PageContainer>
  );
}

NewItemPage.propTypes = {
  onItemSaved: PropTypes.func.isRequired,
};

export default React.memo(NewItemPage);

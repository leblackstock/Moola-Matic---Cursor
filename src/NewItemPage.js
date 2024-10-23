// frontend/src/NewItemPage.js

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import treasureSpecs from './Images/Treasure_Specs01.jpeg';
import { handleAnalyzeImages } from './api/chat.js';
import axios from 'axios';
import { UploadedImagesGallery } from './components/compGallery.js';
import PropTypes from 'prop-types';
import ChatComp from './components/compChat.js';
import FormFields from './components/compFormFields.js';

import {
  handleLocalSave,
  loadLocalData,
  handleManualSave,
  useAutosave,
} from './components/compSave.js';
import { handleFileChange, handleImageDelete } from './components/compUpload.js';

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

// Modal Component for Analysis Warning
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
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // State declarations
  const [item, setItem] = useState(null);
  const [contextData, setContextData] = useState({});
  const [messages, setMessages] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const backendPort = process.env.REACT_APP_BACKEND_PORT || 3001;
  const [isLoading, setIsLoading] = useState(true);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPerformed, setAnalysisPerformed] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({
    totalImages: 0,
    completedImages: 0,
    currentImageName: '',
    intermediateResults: [],
  });
  const [showAnalysisWarning, setShowAnalysisWarning] = useState(false);
  const [analysisDetails, setAnalysisDetails] = useState('');
  const [analysisTimeLeft, setAnalysisTimeLeft] = useState(0);

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
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
    if (item && itemId) {
      const autosaveData = {
        ...item,
        images: uploadedImages,
        messages: messages,
        contextData: contextData,
      };
      updateAutosaveData(autosaveData);
    }
  }, [item, itemId, uploadedImages, messages, contextData, updateAutosaveData]);

  // Memoize messages
  const memoizedMessages = useMemo(() => messages, [messages]);

  // Memoize updateItem function
  const memoizedUpdateItem = useCallback((field, value) => {
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
    const loadData = async () => {
      if (!itemId || !location.pathname.includes(`/new-item/${itemId}`)) {
        console.error('No valid itemId in URL');
        toast.error('Error: Missing item ID');
        navigate('/');
        return;
      }

      try {
        const localData = await loadLocalData(itemId);

        if (localData) {
          // Load local data first
          setItem(localData);
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
              toast.error('Error: No data found for this item.');
              navigate('/');
              return;
            }
          } catch (dbError) {
            console.error('Error fetching item from database:', dbError);
            toast.error('Error fetching item from database.');
            navigate('/');
            return;
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error loading data.');
        navigate('/');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [itemId, navigate, onItemSaved, location.pathname]);

  // Effect to update parent component when local item changes
  useEffect(() => {
    if (item && !isAutosaveUpdate.current) {
      onItemSaved(item.itemId);
    }
    isAutosaveUpdate.current = false;
  }, [item, onItemSaved]);

  // Effect to save to localStorage
  useEffect(() => {
    if (item && itemId) {
      handleLocalSave(item, contextData, messages, itemId);
    }
  }, [item, contextData, messages, itemId]);

  // Effect to clear localStorage on unmount
  useEffect(() => {
    return () => {
      if (item && itemId) {
        handleLocalSave(item, contextData, messages, itemId);
      }
    };
  }, [item, contextData, messages, itemId]);

  // Effect to set selected image
  useEffect(() => {
    if (uploadedImages.length > 0 && !selectedImage) {
      setSelectedImage(uploadedImages[uploadedImages.length - 1]);
    }
  }, [uploadedImages, selectedImage]);

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    // Implement your submission logic here
    // For example, validate and send data to the server
  };

  // Handle file change (image uploads)
  const handleFileChangeWrapper = async event => {
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

  // Handle image button click to trigger file input
  const handleImageButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle media click from modal
  const handleMediaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setShowImageModal(false);
  };

  // Handle starting and ending loading states
  const handleStartLoading = () => {
    setIsLoading(true);
  };

  const handleEndLoading = () => {
    setIsLoading(false);
  };

  // Handle image deletion
  const handleDeleteImageWrapper = imageToDelete => {
    handleImageDelete(imageToDelete, itemId, setUploadedImages, setItem);
  };

  // Update item with nested properties
  const updateItem = (field, value) => {
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
  };

  // Handle purchase recommendation change
  const handlePurchaseRecommendationChange = value => {
    updateItem(
      'finalRecommendation.purchaseRecommendation',
      value === 'true' ? true : value === 'false' ? false : null
    );
  };

  // Handle analyze images
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

  // Effect to check for ongoing analysis on mount
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
  }, [item?.isAnalyzing, item?.analysisProgress, uploadedImages]);

  // Timer for analysis time left
  useEffect(() => {
    let timer;
    if (isAnalyzing && analysisTimeLeft > 0) {
      timer = setInterval(() => {
        setAnalysisTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing, analysisTimeLeft]);

  // Handle Save Draft
  const handleSaveDraft = async () => {
    if (!item || !itemId) {
      console.error('No item to save or missing itemId');
      toast.error('Error: Unable to save draft');
      return;
    }

    try {
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
      onItemSaved(itemId);
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error(`Error saving draft: ${error.message}`);
    }
  };

  // Camera Click Handler (Placeholder)
  const handleCameraClick = () => {
    // Implement your camera click logic here
    toast.info('Camera functionality is not implemented yet.');
  };

  // Handlers for Analysis Warning Modal
  const handleAnalysisWarningConfirm = async () => {
    setShowAnalysisWarning(false);
    // Continue with analysis even without details
    try {
      await handleAnalyzeImagesWrapper();
    } catch (error) {
      console.error('Error after confirming analysis without details:', error);
    }
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

          {/* Save Draft Button */}
          <StyledButton onClick={handleSaveDraft}>Save Draft</StyledButton>

          {hasUnsavedChanges && <span>Unsaved changes</span>}

          {/* Form Fields */}
          <FormFields
            item={item}
            updateItem={memoizedUpdateItem}
            handleSubmit={handleSubmit}
            handleSaveDraft={handleSaveDraft}
            handlePurchaseRecommendationChange={handlePurchaseRecommendationChange}
            itemId={itemId}
            analysisResult={analysisPerformed ? item?.analysisResults?.summary : null}
            lastAutoSave={lastAutoSave}
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

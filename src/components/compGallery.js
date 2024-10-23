// frontend/src/components/compGallery.js

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// import { toast } from 'react-toastify';
import {
  GalleryContainer,
  ImageContainer,
  StyledImage,
  HoverDeleteButton,
  ErrorImagePlaceholder,
} from './compStyles.js';
import { getImageUrl } from '../helpers/itemGen.js';

export const UploadedImagesGallery = ({ images, onSelect, selectedImage, onDelete, itemId }) => {
  const [deletingImages, setDeletingImages] = useState([]);
  const [addedImages, setAddedImages] = useState([]);

  useEffect(() => {
    // When images change, check for new images and add them to addedImages
    const newImages = images.filter(img => !addedImages.includes(img.filename));
    if (newImages.length > 0) {
      setAddedImages(prev => [...prev, ...newImages.map(img => img.filename)]);
      // Remove the 'adding' class after animation completes
      setTimeout(() => {
        setAddedImages([]);
      }, 500); // This should match the duration of the addImageAnimation
    }
  }, [images]);

  const handleDelete = image => {
    setDeletingImages([...deletingImages, image.filename]);
    setTimeout(() => {
      onDelete(image);
      setDeletingImages(deletingImages.filter(filename => filename !== image.filename));
    }, 500); // This should match the duration of the deleteAnimation
  };

  return (
    <GalleryContainer>
      {images.map((image, index) => {
        const imageUrl = getImageUrl(itemId, image.filename);
        const isDeleting = deletingImages.includes(image.filename);
        const isAdding = addedImages.includes(image.filename);
        return (
          <ImageContainer
            key={`${image.id || image.filename}-${index}`}
            className={`${isDeleting ? 'deleting' : ''} ${isAdding ? 'adding' : ''}`}
          >
            {imageUrl ? (
              <StyledImage
                src={`${imageUrl}?t=${Date.now()}`}
                alt={`Uploaded image ${index + 1}`}
                onClick={() => onSelect(image, itemId)}
                style={{
                  border: selectedImage === image ? '2px solid blue' : 'none',
                }}
                onError={e => {
                  console.error(`Failed to load image: ${image.filename}`);
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentElement.style.backgroundColor = '#f0f0f0';
                }}
              />
            ) : (
              <ErrorImagePlaceholder>No Image</ErrorImagePlaceholder>
            )}
            <HoverDeleteButton
              onClick={e => {
                e.stopPropagation();
                handleDelete(image);
              }}
            >
              ×
            </HoverDeleteButton>
          </ImageContainer>
        );
      })}
    </GalleryContainer>
  );
};

UploadedImagesGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      filename: PropTypes.string,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedImage: PropTypes.object,
  onDelete: PropTypes.func.isRequired,
  itemId: PropTypes.string.isRequired,
};

export const DraftItemGallery = ({ items, onSelect, onDelete }) => {
  if (items.length === 0) {
    return <div>No drafts available</div>;
  }

  return (
    <GalleryContainer>
      {items.map((item, index) => {
        const imageUrl =
          item.imageUrl ||
          (item.images &&
            item.images.length > 0 &&
            getImageUrl(item.itemId, item.images[0].filename)) ||
          (item.filename && getImageUrl(item.itemId, item.filename)) ||
          null;

        const uniqueKey = `${item.itemId || item._id || ''}-${index}`;
        return (
          <ImageContainer key={uniqueKey} onClick={() => onSelect(item)} $noImage={!imageUrl}>
            {imageUrl ? (
              <StyledImage
                src={imageUrl}
                alt={`Draft image ${item.name || 'unnamed'}`}
                onError={e => {
                  console.error(`Failed to load image: ${imageUrl}`);
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentElement.style.backgroundColor = 'rgba(138, 43, 226, 0.2)';
                }}
              />
            ) : (
              <ErrorImagePlaceholder>No Image</ErrorImagePlaceholder>
            )}
            <HoverDeleteButton
              onClick={e => {
                e.stopPropagation();
                onDelete(item);
              }}
            >
              ×
            </HoverDeleteButton>
          </ImageContainer>
        );
      })}
    </GalleryContainer>
  );
};

DraftItemGallery.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.string,
      _id: PropTypes.string,
      imageUrl: PropTypes.string,
      filename: PropTypes.string,
      name: PropTypes.string,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export const PurchasedItemGallery = ({ items, onSelect, onDelete }) => {
  if (items.length === 0) {
    return <div>No purchased items available</div>;
  }

  return (
    <GalleryContainer>
      {items.map((item, index) => {
        const imageUrl = item.imageUrl || getImageUrl(item.itemId, item.filename);
        const uniqueKey = `${item.id || item._id || ''}-${index}`;
        return (
          <ImageContainer key={uniqueKey} onClick={() => onSelect(item)}>
            {imageUrl ? (
              <StyledImage
                src={imageUrl}
                alt={`Purchased item ${item.name || 'unnamed'}`}
                onError={e => {
                  console.error(`Failed to load image: ${imageUrl}`);
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentElement.style.backgroundColor = '#f0f0f0';
                }}
              />
            ) : (
              <ErrorImagePlaceholder>No Image</ErrorImagePlaceholder>
            )}
            <HoverDeleteButton
              onClick={e => {
                e.stopPropagation();
                onDelete(item);
              }}
            >
              ×
            </HoverDeleteButton>
          </ImageContainer>
        );
      })}
    </GalleryContainer>
  );
};

PurchasedItemGallery.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      _id: PropTypes.string,
      itemId: PropTypes.string,
      imageUrl: PropTypes.string,
      filename: PropTypes.string,
      name: PropTypes.string,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

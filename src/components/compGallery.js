// frontend/src/components/compGallery.js

import React from 'react';
import PropTypes from 'prop-types';
import {
  GalleryContainer,
  ImageContainer,
  StyledImage,
  HoverDeleteButton,
  ErrorImagePlaceholder,
} from './compStyles.js';

import { getImageUrl } from '../helpers/itemGen.js';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export const UploadedImagesGallery = ({
  images,
  onSelect,
  selectedImage,
  onDelete,
  itemId,
}) => {
  const imagesArray = Array.isArray(images) ? images : [];

  const retryImage = (imageId) => {
    setRetryCount((prev) => ({
      ...prev,
      [imageId]: (prev[imageId] || 0) + 1,
    }));
  };

  if (!itemId) {
    console.error('itemId is undefined in UploadedImagesGallery');
    return <div>Error: Unable to display images</div>;
  }

  const validImages = imagesArray.filter(
    (image) => image && typeof image === 'object' && image.filename
  );

  if (validImages.length === 0) {
    return <div>No images available</div>;
  }

  return (
    <GalleryContainer>
      {validImages.map((image, index) => {
        const imageUrl = getImageUrl(itemId, image.filename);
        const uniqueKey = `${image.id || image.filename || ''}-${index}`;
        return (
          <ImageContainer
            key={uniqueKey}
            onClick={() => onSelect(image)}
            $isSelected={selectedImage === image}
          >
            {imageUrl ? (
              <StyledImage
                src={imageUrl}
                alt={`Uploaded image ${image.filename || 'unnamed'}`}
                onError={(e) => {
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
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image);
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
        // Improved image URL selection logic
        const imageUrl =
          item.imageUrl ||
          (item.images &&
            item.images.length > 0 &&
            getImageUrl(item.itemId, item.images[0].filename)) ||
          (item.filename && getImageUrl(item.itemId, item.filename)) ||
          null;

        const uniqueKey = `${item.itemId || item._id || ''}-${index}`;
        return (
          <ImageContainer key={uniqueKey} onClick={() => onSelect(item)}>
            {imageUrl ? (
              <StyledImage
                src={imageUrl}
                alt={`Draft image ${item.name || 'unnamed'}`}
                onError={(e) => {
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
              onClick={(e) => {
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
        const imageUrl =
          item.imageUrl || getImageUrl(item.itemId, item.filename);
        const uniqueKey = `${item.id || item._id || ''}-${index}`;
        return (
          <ImageContainer key={uniqueKey} onClick={() => onSelect(item)}>
            {imageUrl ? (
              <StyledImage
                src={imageUrl}
                alt={`Purchased item ${item.name || 'unnamed'}`}
                onError={(e) => {
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
              onClick={(e) => {
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

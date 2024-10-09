// frontend/src/components/compGallery.js

import React from 'react';
import {
  GalleryContainer,
  ImageContainer,
  StyledImage,
  HoverDeleteButton,
  ErrorImagePlaceholder,
  DraftItemOverlay, // Make sure this line is present
} from './compStyles.js';

import PropTypes from 'prop-types';

export const UploadedImagesGallery = ({
  images,
  onSelect,
  selectedImage,
  onDelete,
}) => {
  console.log('UploadedImagesGallery: Received images:', images);

  const validImages = images.filter(
    (image) =>
      image && typeof image === 'object' && (image.url || image.localUrl)
  );

  if (validImages.length === 0) {
    return <div>No images available</div>;
  }

  return (
    <GalleryContainer>
      {validImages.map((image) => {
        console.log(`Rendering image:`, image);
        const imageUrl = image.url || image.localUrl;
        return (
          <ImageContainer
            key={
              image.id ||
              image.filename ||
              Math.random().toString(36).substr(2, 9)
            }
            onClick={() => onSelect(image)}
            $isSelected={selectedImage === image}
          >
            {imageUrl ? (
              <StyledImage
                src={imageUrl}
                alt={`Uploaded image ${image.filename || 'unnamed'}`}
                onError={(e) => {
                  console.error(`Error loading image: ${imageUrl}`);
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : (
              <ErrorImagePlaceholder>No URL available</ErrorImagePlaceholder>
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

export const DraftItemGallery = ({ items, onSelect, onDelete }) => {
  return (
    <GalleryContainer>
      {items.map((item, index) => {
        const imageUrl =
          item.images && item.images.length > 0 ? item.images[0].url : null;
        const displayText = (item.name || item.itemId || '').slice(-6);
        return (
          <ImageContainer key={item.itemId} onClick={() => onSelect(item)}>
            {imageUrl ? (
              <StyledImage src={imageUrl} alt={`Draft item ${index + 1}`} />
            ) : (
              <div>No Image</div>
            )}
            <DraftItemOverlay>{displayText}</DraftItemOverlay>
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

UploadedImagesGallery.propTypes = {
  images: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedImage: PropTypes.object,
  onDelete: PropTypes.func.isRequired,
};

DraftItemGallery.propTypes = {
  items: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// frontend/src/components/compGallery.js

import React from 'react';
import {
  GalleryContainer,
  ImageContainer,
  StyledImage,
  HoverDeleteButton,
  ErrorImagePlaceholder,
  DraftItemOverlay, // This is likely the existing style you were referring to
} from './compStyles.js';

export const UploadedImagesGallery = ({
  images,
  onSelect,
  selectedImage,
  onDelete,
}) => {
  return (
    <GalleryContainer>
      {images.map((image, index) => (
        <ImageContainer
          key={image.id || `image-${index}`}
          onClick={() => onSelect(image)}
          $isSelected={selectedImage === image}
        >
          {image.url ? (
            <StyledImage 
              src={image.url} 
              alt={`Uploaded image ${index + 1}`} 
              onError={(e) => {
                console.error(`Error loading image: ${image.url}`);
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <ErrorImagePlaceholder>
            Error loading image
          </ErrorImagePlaceholder>
          <HoverDeleteButton
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image);
            }}
          >
            ×
          </HoverDeleteButton>
        </ImageContainer>
      ))}
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

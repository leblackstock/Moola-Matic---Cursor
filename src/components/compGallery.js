import React from 'react';
import {
  GalleryContainer,
  ImageContainer,
  StyledImage,
  HoverDeleteButton
} from './compStyles.js';

const UploadedImagesGallery = ({ images, onSelect, selectedImage, onDelete }) => {
  return (
    <GalleryContainer>
      {images.map((image, index) => (
        <ImageContainer
          key={index}
          onClick={() => onSelect(image)}
          $isSelected={selectedImage === image}
        >
          <StyledImage src={image.url} alt={`Uploaded image ${index + 1}`} />
          <HoverDeleteButton onClick={(e) => {
            e.stopPropagation();
            onDelete(image);
          }}>×</HoverDeleteButton>
        </ImageContainer>
      ))}
    </GalleryContainer>
  );
};

export default UploadedImagesGallery;
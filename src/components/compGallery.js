import React from 'react';
import styled from 'styled-components';
import { DeleteButton } from './compStyles.js';  // Add the .js extension

const GalleryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
`;

const ImageContainer = styled.div`
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  border: ${props => props.$isSelected ? '2px solid #00FFFF' : '2px solid transparent'};
  border-radius: 5px;
  overflow: hidden;

  &:hover ${DeleteButton} {
    opacity: 1;
  }
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HoverDeleteButton = styled(DeleteButton)`
  opacity: 0;
  transition: opacity 0.3s ease;
`;

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
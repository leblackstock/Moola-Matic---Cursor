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

const backendPort = process.env.REACT_APP_BACKEND_PORT || 3001;

const getImageUrl = (itemId, filename) => {
  if (!itemId || !filename) {
    console.error('Invalid itemId or filename:', { itemId, filename });
    return null;
  }
  return `http://localhost:${backendPort}/uploads/drafts/${itemId}/${filename}`;
};

export const UploadedImagesGallery = ({
  images,
  onSelect,
  selectedImage,
  onDelete,
  itemId,
}) => {
  const [retryCount, setRetryCount] = React.useState({});

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

  const validImages = images.filter(
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
                onError={() => {
                  if ((retryCount[image.id] || 0) < 3) {
                    console.log(`Retrying image: ${imageUrl}`);
                    setTimeout(() => retryImage(image.id), 2000);
                  } else {
                    console.error(
                      `Failed to load image after retries: ${imageUrl}`
                    );
                  }
                }}
              />
            ) : (
              <ErrorImagePlaceholder>No Image</ErrorImagePlaceholder>
            )}
            <HoverDeleteButton
              onClick={(e) => {
                e.stopPropagation();
                console.log('Deleting image:', image);
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
  console.log('Rendering DraftItemGallery with items:', items);
  const [retryCount, setRetryCount] = React.useState({});

  const retryImage = (itemId) => {
    setRetryCount((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  return (
    <GalleryContainer $isDraftGallery>
      {items.map((item, index) => {
        console.log('Rendering draft item:', item);
        const imageUrl =
          item.images && item.images.length > 0
            ? getImageUrl(item.itemId, item.images[0].filename)
            : null;
        console.log('Image URL for draft item:', imageUrl);
        const displayText = (item.name || item.itemId || '').slice(-6);
        return (
          <ImageContainer key={item.itemId} onClick={() => onSelect(item)}>
            {imageUrl ? (
              <StyledImage
                src={imageUrl}
                alt={`Draft item ${index + 1}`}
                onError={() => {
                  if ((retryCount[item.itemId] || 0) < 3) {
                    console.log(`Retrying image: ${imageUrl}`);
                    setTimeout(() => retryImage(item.itemId), 2000);
                  } else {
                    console.error(
                      `Failed to load image after retries: ${imageUrl}`
                    );
                  }
                }}
              />
            ) : (
              <ErrorImagePlaceholder>No Image</ErrorImagePlaceholder>
            )}
            <DraftItemOverlay>{displayText}</DraftItemOverlay>
            <HoverDeleteButton
              onClick={(e) => {
                e.stopPropagation();
                console.log('Deleting draft:', item);
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
  itemId: PropTypes.string.isRequired,
};

DraftItemGallery.propTypes = {
  items: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

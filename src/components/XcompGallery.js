import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import styled from 'styled-components';

const GalleryContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
`;

const ImageItem = styled.div`
  width: 100px;
  height: 100px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
`;

export const UploadedImagesGallery = ({ images, onReorder }) => {
  const onDragEnd = result => {
    if (!result.destination) {
      return;
    }

    const reorderedImages = Array.from(images);
    const [reorderedItem] = reorderedImages.splice(result.source.index, 1);
    reorderedImages.splice(result.destination.index, 0, reorderedItem);

    onReorder(reorderedImages);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="images" direction="horizontal">
        {provided => (
          <GalleryContainer {...provided.droppableProps} ref={provided.innerRef}>
            {images.map((image, index) => {
              // Use a consistent ID that doesn't change between renders
              const draggableId = image.id || `image-${index}`;
              return (
                <Draggable key={draggableId} draggableId={draggableId} index={index}>
                  {(provided, snapshot) => (
                    <ImageItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        backgroundColor: snapshot.isDragging ? '#e0e0e0' : '#f0f0f0',
                      }}
                    >
                      {image.filename || `Image ${index + 1}`}
                    </ImageItem>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </GalleryContainer>
        )}
      </Droppable>
    </DragDropContext>
  );
};

UploadedImagesGallery.propTypes = {
  images: PropTypes.array.isRequired,
  onReorder: PropTypes.func.isRequired,
};

export const DraftItemGallery = ({ items }) => {
  return (
    <GalleryContainer>
      {items.map((item, index) => (
        <ImageItem key={item.id || index}>{item.name || 'Draft Item'}</ImageItem>
      ))}
    </GalleryContainer>
  );
};

DraftItemGallery.propTypes = {
  items: PropTypes.array.isRequired,
};

export const PurchasedItemGallery = ({ items }) => {
  return (
    <GalleryContainer>
      {items.map((item, index) => (
        <ImageItem key={item.id || index}>{item.name || 'Purchased Item'}</ImageItem>
      ))}
    </GalleryContainer>
  );
};

PurchasedItemGallery.propTypes = {
  items: PropTypes.array.isRequired,
};

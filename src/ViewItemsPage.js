import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItems, fetchDrafts, deleteDraft } from './components/compSave.js';
import {
  PageContainer,
  PageTitle,
  PageSubtitle,
  ItemList,
  ItemListItem,
  ItemPrice,
  DraftGallery,
  DraftItem,
  DraftItemOverlay,
  DeleteButton
} from './components/compStyles.js';

const getDraftImageUrl = (draft) => {
  // Implement the logic to get the image URL from the draft
  return draft.imageUrl || 'default-image-url';
};

function ViewItemsPage() {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems().then(setItems).catch(console.error);
    fetchDrafts().then(setDrafts).catch(console.error);
  }, []);

  const handleDraftClick = (draft) => {
    console.log("Clicking draft:", draft);
    console.log("Draft messages:", draft.messages);
    navigate(`/new-item/${draft.itemId || draft._id}`);
  };

  const handleDeleteDraft = async (e, draft) => {
    e.stopPropagation();
    const id = draft.itemId || draft._id;
    try {
      await deleteDraft(id);
      setDrafts(drafts.filter(d => (d.itemId || d._id) !== id));
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert(`Error deleting draft: ${error.message}`);
    }
  };

  return (
    <PageContainer>
      <PageTitle>Your Treasure Trove</PageTitle>
      <PageSubtitle>Behold, your empire of bargains! Each item is a potential goldmine.</PageSubtitle>
      
      <h3>Drafts</h3>
      <DraftGallery>
        {drafts.length > 0 ? (
          drafts.map(draft => (
            <DraftItem
              key={draft.itemId || `draft-${draft._id}`}
              onClick={() => handleDraftClick(draft)}
              style={{
                backgroundImage: `url(${getDraftImageUrl(draft)})`,
              }}
            >
              <DraftItemOverlay>
                <span>{draft.name || `Item ${(draft.itemId || draft._id).slice(-4)}`}</span>
              </DraftItemOverlay>
              <DeleteButton onClick={(e) => handleDeleteDraft(e, draft)}>×</DeleteButton>
            </DraftItem>
          ))
        ) : (
          <p>No drafts available.</p>
        )}
      </DraftGallery>

      <h3>Listed Items</h3>
      <ItemList>
        {items.length > 0 ? (
          items.map(item => (
            <ItemListItem key={item.id}>
              {item.name}
              <ItemPrice>${item.price}</ItemPrice>
            </ItemListItem>
          ))
        ) : (
          <ItemListItem>No items to display.</ItemListItem>
        )}
      </ItemList>
    </PageContainer>
  );
}

export default ViewItemsPage;

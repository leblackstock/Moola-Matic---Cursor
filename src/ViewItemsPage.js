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
  DeleteButton,
  StyledButton
} from './components/compStyles.js';

const getDraftImageUrl = (draft) => {
  console.log('Getting image URL for draft:', draft);
  if (draft.images && draft.images.length > 0) {
    // Check if the image URL is already a full URL or a blob URL
    if (draft.images[0].startsWith('http') || draft.images[0].startsWith('blob:')) {
      console.log('Image URL:', draft.images[0]);
      return draft.images[0];
    } else {
      // If it's a relative path, prepend the backend URL
      const url = `http://localhost:${process.env.REACT_APP_BACKEND_PORT}${draft.images[0]}`;
      console.log('Image URL:', url);
      return url;
    }
  }
  console.log('No image available for draft');
  return null;
};

function ViewItemsPage() {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems().then(setItems).catch(console.error);
    fetchDrafts().then(fetchedDrafts => {
      console.log('Drafts received in ViewItemsPage:', fetchedDrafts);
      setDrafts(fetchedDrafts);
    }).catch(console.error);
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

  const handleDeleteAllDrafts = async () => {
    if (window.confirm('Are you sure you want to delete ALL drafts? This action cannot be undone.')) {
      try {
        // Delete all drafts one by one
        await Promise.all(drafts.map(draft => deleteDraft(draft.itemId || draft._id)));
        // Clear the drafts state
        setDrafts([]);
        console.log('All drafts deleted successfully');
      } catch (error) {
        console.error('Error deleting all drafts:', error);
        alert(`Error deleting all drafts: ${error.message}`);
      }
    }
  };

  return (
    <PageContainer>
      <PageTitle>Your Treasure Trove</PageTitle>
      <PageSubtitle>Behold, your empire of bargains! Each item is a potential goldmine.</PageSubtitle>
      
      <h3>Drafts</h3>
      <StyledButton onClick={handleDeleteAllDrafts} style={{marginBottom: '1rem', backgroundColor: 'red', color: 'white'}}>
        DEBUG: Delete All Drafts
      </StyledButton>
      <DraftGallery>
        {drafts.length > 0 ? (
          drafts.map(draft => {
            console.log('Rendering draft:', draft);
            return (
              <DraftItem
                key={draft.itemId || `draft-${draft._id}`}
                onClick={() => handleDraftClick(draft)}
                style={{
                  backgroundImage: getDraftImageUrl(draft) ? `url(${getDraftImageUrl(draft)})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!getDraftImageUrl(draft) && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <span>No Image</span>
                  </div>
                )}
                <DraftItemOverlay>
                  <span>{draft.name || `Item ${(draft.itemId || draft._id).slice(-4)}`}</span>
                </DraftItemOverlay>
                <DeleteButton onClick={(e) => handleDeleteDraft(e, draft)}>×</DeleteButton>
              </DraftItem>
            );
          })
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

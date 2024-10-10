import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchItems,
  fetchDrafts,
  deleteDraft,
  clearLocalData,
  saveToLocalStorage,
  loadLocalData, // Add this import
} from './components/compSave.js';
import {
  PageContainer,
  PageTitle,
  PageSubtitle,
  ItemList,
  ItemListItem,
  ItemPrice,
  StyledButton,
} from './components/compStyles.js';
import { DraftItemGallery } from './components/compGallery.js';

function ViewItemsPage() {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Fetching items and drafts...');
    fetchItems()
      .then((fetchedItems) => {
        console.log('Fetched items:', fetchedItems);
        setItems(fetchedItems);
      })
      .catch((error) => console.error('Error fetching items:', error));

    fetchDrafts()
      .then((fetchedDrafts) => {
        console.log('Fetched drafts:', fetchedDrafts);
        setDrafts(fetchedDrafts);
      })
      .catch((error) => console.error('Error fetching drafts:', error));
  }, []);

  const handleDraftClick = (draft) => {
    console.log('Draft clicked:', draft);
    clearLocalData();
    console.log('Local data cleared');

    console.log('Saving draft to local storage:', draft);
    saveToLocalStorage(draft);

    // Verify that the data was saved correctly
    const savedData = loadLocalData(draft.itemId);
    console.log('Verified saved data:', savedData);

    if (savedData) {
      navigate(`/new-item/${draft.itemId || draft._id}`);
      console.log('Navigating to draft edit page');
    } else {
      console.error('Failed to save draft to local storage');
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteDraft = async (draft) => {
    console.log('Attempting to delete draft:', draft);
    const id = draft.itemId || (draft._id && draft._id.toString());
    if (!id) {
      console.error('Invalid draft ID:', draft);
      return;
    }

    const isConfirmed = window.confirm(
      "Arrr ye sure ye want to send this treasure map to Davy Jones' locker? There be no retrievin' it once it's gone!"
    );

    if (!isConfirmed) {
      console.log('Draft deletion cancelled by user');
      return;
    }

    try {
      console.log('Deleting draft with ID:', id);
      await deleteDraft(id);
      console.log('Draft deleted successfully');
      setDrafts(
        drafts.filter((d) => {
          const dId = d.itemId || (d._id && d._id.toString());
          return dId !== id;
        })
      );
      console.log('Drafts state updated');
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert(`Error deleting draft: ${error.message}`);
    }
  };

  const handleDeleteAllDrafts = async () => {
    console.log('Attempting to delete all drafts');
    if (
      window.confirm(
        'Are you sure you want to delete ALL drafts? This action cannot be undone.'
      )
    ) {
      try {
        console.log('Deleting all drafts...');
        await Promise.all(
          drafts.map((draft) => {
            const id = draft.itemId || (draft._id && draft._id.toString());
            if (!id) {
              console.error('Invalid draft ID:', draft);
              return Promise.resolve();
            }
            console.log('Deleting draft with ID:', id);
            return deleteDraft(id);
          })
        );
        console.log('All drafts deleted successfully');
        setDrafts([]);
        console.log('Drafts state cleared');
      } catch (error) {
        console.error('Error deleting all drafts:', error);
        alert(`Error deleting all drafts: ${error.message}`);
      }
    } else {
      console.log('Delete all drafts cancelled by user');
    }
  };

  console.log('Rendering ViewItemsPage with drafts:', drafts);

  return (
    <PageContainer>
      <PageTitle>Your Treasure Trove</PageTitle>
      <PageSubtitle>
        Behold, your empire of bargains! Each item is a potential goldmine.
      </PageSubtitle>

      <h3>Drafts</h3>
      <StyledButton
        onClick={handleDeleteAllDrafts}
        style={{ marginBottom: '1rem', backgroundColor: 'red', color: 'white' }}
      >
        DEBUG: Delete All Drafts
      </StyledButton>
      <DraftItemGallery
        items={drafts}
        onSelect={handleDraftClick}
        onDelete={handleDeleteDraft}
      />

      <h3>Listed Items</h3>
      <ItemList>
        {items.length > 0 ? (
          items.map((item) => (
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

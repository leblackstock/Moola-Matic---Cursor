import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllItems,
  // fetchDrafts,
  deleteDraft,
  clearLocalData,
  saveToLocalStorage,
  loadLocalData, // Add this import
  saveDraft, // Add this import
  deleteAllDrafts, // Add this import
} from './components/compSave.js';
import {
  PageContainer,
  PageTitle,
  PageSubtitle,
  // ItemList,
  // ItemListItem,
  // ItemPrice,
  StyledButton,
} from './components/compStyles.js';
import { DraftItemGallery } from './components/compGallery.js';
import PropTypes from 'prop-types';
import { PurchasedItemGallery } from './components/compGallery.js'; // Add this import

function ViewItemsPage({ currentItemId }) {
  const [purchasedItems, setPurchasedItems] = useState([]); // Change items to purchasedItems
  const [drafts, setDrafts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Fetching all items and drafts...');

    fetchAllItems()
      .then(fetchedItems => {
        // Add this detailed logging
        console.log(
          'Detailed item analysis:',
          fetchedItems.map(item => ({
            itemId: item.itemId,
            isDraft: item.isDraft,
            _id: item._id,
            name: item.name,
          }))
        );

        console.log('Fetched all items:', fetchedItems);

        // Remove duplicates based on itemId
        const uniqueItems = fetchedItems.reduce((acc, current) => {
          const x = acc.find(item => item.itemId === current.itemId);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        // Filter out drafts and set as purchased items
        const purchasedItems = uniqueItems.filter(item => !item.isDraft);
        console.log('Filtered purchased items:', purchasedItems);
        setPurchasedItems(purchasedItems);

        // Set drafts from the same uniqueItems array
        const drafts = uniqueItems.filter(item => item.isDraft);
        console.log('Filtered drafts:', drafts);
        setDrafts(drafts);

        // Add this detailed logging
        console.log('First draft object:', JSON.stringify(fetchedItems[0], null, 2));
        console.log('Second draft object:', JSON.stringify(fetchedItems[1], null, 2));
        console.log('Third draft object:', JSON.stringify(fetchedItems[2], null, 2));
      })
      .catch(error => {
        console.error('Error fetching all items:', error);
      });

    // Comment out the separate fetchDrafts call for now
    // fetchDrafts()
    //   .then((fetchedDrafts) => {
    //     console.log('Fetched drafts:', fetchedDrafts);
    //     setDrafts(fetchedDrafts);
    //   })
    //   .catch((error) => {
    //     console.error('Error fetching drafts:', error);
    //   });

    if (currentItemId) {
      // Scroll to the item with currentItemId or highlight it
      const itemElement = document.getElementById(`item-${currentItemId}`);
      if (itemElement) {
        itemElement.scrollIntoView({ behavior: 'smooth' });
        itemElement.classList.add('highlight');
      }
    }
  }, [currentItemId]);

  const handleDraftClick = draft => {
    console.log('Draft clicked:', draft);
    clearLocalData();
    console.log('Local data cleared');

    const itemId = draft.itemId || draft._id;
    console.log('Saving draft to local storage with itemId:', itemId);

    // Ensure images are included in the saved draft
    const draftToSave = {
      ...draft,
      images: draft.images || [],
    };

    saveToLocalStorage(itemId, draftToSave);

    // Verify that the data was saved correctly
    const savedData = loadLocalData(itemId);
    console.log('Verified saved data:', savedData);

    if (savedData) {
      navigate(`/new-item/${itemId}`);
      console.log('Navigating to draft edit page');
    } else {
      console.error('Failed to save draft to local storage');
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteDraft = async draft => {
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
        drafts.filter(d => {
          const dId = d.itemId || d._id;
          return dId !== id;
        })
      );
      console.log('Drafts state updated');
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert(`Error deleting draft: ${error.message}`);
    }
  };

  const handleSaveDraft = async draft => {
    if (!draft || !draft.itemId) {
      console.error('No draft to save or itemId is missing');
      alert('Error: Unable to save draft (missing itemId)');
      return;
    }

    try {
      console.log('Saving draft:', draft);
      const savedDraft = await saveDraft(draft, {}, []); // Pass empty context data and messages
      console.log('Draft saved successfully:', savedDraft);

      // Update the drafts state with the saved draft
      setDrafts(prevDrafts =>
        prevDrafts.map(d => (d.itemId === savedDraft.itemId ? savedDraft : d))
      );

      // Show a success message to the user
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert(`Error saving draft: ${error.message}`);
    }
  };

  const handleDeleteAllDrafts = async () => {
    console.log('Attempting to delete all drafts');
    if (
      window.confirm('Are you sure you want to delete ALL drafts? This action cannot be undone.')
    ) {
      try {
        console.log('Deleting all drafts...');
        await deleteAllDrafts(true); // Pass true to also delete associated images
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

  const handleDeletePurchasedItem = async item => {
    console.log('Deleting purchased item:', item);
    // Implement the logic to delete a purchased item
    // This might involve calling an API endpoint and updating the state
    // For now, let's just show an alert
    alert('Delete purchased item functionality not implemented yet.');
  };

  console.log('Rendering ViewItemsPage with drafts:', drafts);
  console.log('Rendering ViewItemsPage with purchased items:', purchasedItems);

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
        onSave={handleSaveDraft}
      />

      <h3>Purchased Items</h3>
      <PurchasedItemGallery
        items={purchasedItems}
        onSelect={item => console.log('Selected purchased item:', item)}
        onDelete={handleDeletePurchasedItem}
      />
    </PageContainer>
  );
}

ViewItemsPage.propTypes = {
  currentItemId: PropTypes.string,
};

export default ViewItemsPage;

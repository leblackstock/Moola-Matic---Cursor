import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import styled from 'styled-components';

// Add these styled components
const DraftItemContainer = styled.div`
  position: relative;
  &:hover .delete-button {
    opacity: 1;
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &:hover {
    background-color: rgba(255, 0, 0, 1);
  }
`;

function ViewItemsPage() {
    const [items, setItems] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchItems();
        fetchDrafts();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/items');
            if (!response.ok) throw new Error('Failed to fetch items.');
            const data = await response.json();
            console.log('Fetched items:', data); // Add this line for debugging
            setItems(data);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    const fetchDrafts = async () => {
        try {
            const response = await fetch('/api/drafts');
            if (!response.ok) throw new Error('Failed to fetch drafts.');
            const data = await response.json();
            console.log('Fetched drafts:', data); // Add this line for debugging
            setDrafts(data);
        } catch (error) {
            console.error('Error fetching drafts:', error);
        }
    };

    const handleDraftClick = (draft) => {
        console.log("Clicking draft:", draft);
        console.log("Draft messages:", draft.messages);
        navigate('/new-item', { state: { draft } });
    };

    const saveDraft = async (item) => {
        const response = await fetch('/api/save-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        if (!response.ok) throw new Error('Failed to save draft.');
        return await response.json();
    };

    const getDraftImageUrl = (draft) => {
        if (draft.images && draft.images.length > 0) {
            return `http://localhost:${process.env.REACT_APP_BACKEND_PORT}${draft.images[0]}`;
        }
        return '/default-image.jpg';
    };

    const handleDeleteDraft = async (e, draft) => {
        e.stopPropagation(); // Prevent triggering handleDraftClick
        const id = draft.itemId || draft._id; // Use _id as fallback
        try {
            const response = await fetch(`/api/drafts/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete draft.');
            }
            // Remove the deleted draft from the state
            setDrafts(drafts.filter(d => (d.itemId || d._id) !== id));
        } catch (error) {
            console.error('Error deleting draft:', error);
            alert(`Error deleting draft: ${error.message}`);
        }
    };

    return (
      <div className="view-items-page container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <h2 className="mb-3">Your Treasure Trove</h2>
            <p className="mb-4">Behold, your empire of bargains! Each item is a potential goldmine.</p>
            
            <h3 className="mb-3">Drafts</h3>
            <div className="draft-gallery row">
              {drafts.length > 0 ? (
                drafts.map(draft => (
                  <div key={draft.itemId || `draft-${draft._id}`} className="col-md-4 mb-4">
                    <DraftItemContainer
                      className="draft-item" 
                      onClick={() => handleDraftClick(draft)}
                      style={{
                        backgroundImage: `url(${getDraftImageUrl(draft)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        height: '200px',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="draft-item-overlay">
                        <span>
                          {draft.name || `Item ${(draft.itemId || draft._id).slice(-4)}`}
                        </span>
                      </div>
                      <DeleteButton 
                        className="delete-button"
                        onClick={(e) => handleDeleteDraft(e, draft)}
                      >
                        ×
                      </DeleteButton>
                    </DraftItemContainer>
                  </div>
                ))
              ) : (
                <p>No drafts available.</p>
              )}
            </div>

            <h3 className="mb-3 mt-5">Listed Items</h3>
            <ul className="list-group">
              {items.length > 0 ? (
                items.map(item => (
                  <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                    {item.name}
                    <span className="badge bg-primary rounded-pill">${item.price}</span>
                  </li>
                ))
              ) : (
                <li className="list-group-item">No items to display.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
}

export default ViewItemsPage;

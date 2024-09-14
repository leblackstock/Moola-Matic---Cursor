import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function ViewItemsPage() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        // Example: Fetch items from an API when the component mounts
        const fetchItems = async () => {
            try {
                const response = await fetch('/api/items'); // Replace with your actual API endpoint
                if (!response.ok) {
                    throw new Error('Failed to fetch items.');
                }
                const data = await response.json();
                setItems(data);
            } catch (error) {
                console.error('Error fetching items:', error);
            }
        };

        fetchItems();
    }, []);

    return (
      <div className="view-items-page container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <h2 className="mb-3">Your Treasure Trove</h2>
            <p className="mb-4">Behold, your empire of bargains! Each item is a potential goldmine.</p>
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

import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function ViewItemsPage() {
    const [items, setItems] = useState([
        { id: 1, name: 'Vintage Watch', price: 150 },
        { id: 2, name: 'Antique Vase', price: 200 },
        { id: 3, name: 'Rare Comic Book', price: 500 },
    ]);

    return (
      <div className="view-items-page container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <h2 className="mb-3">Your Treasure Trove</h2>
            <p className="mb-4">Behold, your empire of bargains! Each item is a potential goldmine.</p>
            <ul className="list-group">
              {items.map(item => (
                <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {item.name}
                  <span className="badge bg-primary rounded-pill">${item.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
}

export default ViewItemsPage;

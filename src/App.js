import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import moolaMaticLogo from './Images/Moola-Matic Logo 01.jpeg';
import NewItemPage from './NewItemPage';
import ViewItemsPage from './ViewItemsPage';

function Sidebar() {
  return (
    <nav className="sidebar">
      <ul className="nav flex-column">
        <li className="nav-item">
          <NavLink to="/" end className="nav-link" title="Home">
            <i className="fas fa-home icon-cyan"></i>
            <span className="ms-2">Home</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/new-item" className="nav-link" title="Change Item">
            <i className="fas fa-plus-circle icon-cyan"></i>
            <span className="ms-2">Change Item</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/view-items" className="nav-link" title="View Items">
            <i className="fas fa-list icon-cyan"></i>
            <span className="ms-2">View Items</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

function WarningBox({ onProceed, onGoBack }) {
  return (
    <div className="warning-box-overlay">
      <div className="warning-box">
        <h2>Whoa there, bargain hunter!</h2>
        <p>Are you sure you want to embark on a new treasure hunt? Any unsaved progress on your current item will vanish faster than a yard sale deal!</p>
        <div className="warning-box-buttons">
          <button className="warning-box-button proceed-button" onClick={onProceed}>Let's do this!</button>
          <button className="warning-box-button go-back-button" onClick={onGoBack}>Oops, nevermind!</button>
        </div>
      </div>
    </div>
  );
}

function LandingPage({ setNewItemCreated, setItemId }) {
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();

  const handleNewItemClick = (e) => {
    e.preventDefault();
    setShowWarning(true);  // This just shows the warning box
  };

  const handleProceed = () => {
    setShowWarning(false);
    setNewItemCreated(true);
    const newItemId = Math.floor(Math.random() * 1000000).toString();
    setItemId(newItemId);
    navigate('/new-item');
  };

  const handleGoBack = () => {
    setShowWarning(false);
  };

  return (
    <div className="landing-page container">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <img 
            src={moolaMaticLogo} 
            alt="Moola-Matic Logo" 
            className="img-fluid mb-4 square-to-circle" 
          />
          <h1 className="display-4">Moola-Matic</h1>
          <p className="lead mb-4">Turn your thrifty finds into a treasure trove of cold, hard cash!</p>
          <div className="mb-4">
            <button onClick={handleNewItemClick} className="btn btn-primary-theme me-2 dark-red-glow">New Item</button>
            <NavLink to="/view-items" className="btn btn-secondary-theme cyan-glow">View Items</NavLink>
          </div>
          {showWarning && <WarningBox onProceed={handleProceed} onGoBack={handleGoBack} />}
          <div className="info-box">
            <p>Are you sitting on a goldmine of garage sale goodies? Let Moola-Matic help you squeeze every last penny out of your dusty discoveries!</p>
            <p className="fst-italic">We're like a money-making time machine for your junk drawer!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [newItemCreated, setNewItemCreated] = useState(() => {
    // Initialize from localStorage, default to false if not set
    return JSON.parse(localStorage.getItem('newItemCreated')) || false;
  });

  const [itemId, setItemId] = useState(() => {
    // Initialize from localStorage, default to '0' if not set
    return localStorage.getItem('itemId') || '0';
  });

  useEffect(() => {
    // Update localStorage whenever newItemCreated changes
    localStorage.setItem('newItemCreated', JSON.stringify(newItemCreated));
  }, [newItemCreated]);

  useEffect(() => {
    // Update localStorage whenever itemId changes
    localStorage.setItem('itemId', itemId);
  }, [itemId]);

  useEffect(() => {
    console.log('Styles loaded:', {
      bootstrap: typeof document !== 'undefined' && document.querySelector('style[data-href*="bootstrap"]'),
      fontawesome: typeof document !== 'undefined' && document.querySelector('style[data-href*="fontawesome"]'),
      appCss: typeof document !== 'undefined' && document.querySelector('style[data-href*="App.css"]')
    });
  }, []);

  console.log('App component is rendering');

  return (
    <Router>
      <div className="app d-flex">
        <Sidebar />
        <main className="flex-grow-1 p-3">
          <Routes>
            <Route path="/" element={<LandingPage setNewItemCreated={setNewItemCreated} setItemId={setItemId} />} />
            <Route path="/new-item" element={<NewItemPage setNewItemCreated={setNewItemCreated} itemId={itemId} />} />
            <Route path="/view-items" element={<ViewItemsPage newItemCreated={newItemCreated} setNewItemCreated={setNewItemCreated} />} />
            <Route path="*" element={<LandingPage setNewItemCreated={setNewItemCreated} setItemId={setItemId} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

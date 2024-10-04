// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'; // Removed BrowserRouter
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import moolaMaticLogo from './Images/Moola-Matic Logo 01.jpeg';
import NewItemPage from './NewItemPage.js'; // Ensure correct path and extension
import ViewItemsPage from './ViewItemsPage.js'; // Ensure correct path and extension
import { v4 as uuidv4 } from 'uuid';

/**
 * Sidebar Component
 * Renders the navigation sidebar with links to different routes.
 */
function Sidebar({ handleLogout, handleChangeItem }) {
  return (
    <nav className="sidebar">
      <ul className="nav flex-column">
        {/* Home Link */}
        <li className="nav-item">
          <NavLink to="/" end className="nav-link" title="Home">
            <i className="fas fa-home icon-cyan"></i>
            <span className="ms-2">Home</span>
          </NavLink>
        </li>
        {/* New Item Link */}
        <li className="nav-item">
          <button onClick={handleChangeItem} className="nav-link btn btn-link" title="Change Item">
            <i className="fas fa-plus-circle icon-cyan"></i>
            <span className="ms-2">Change Item</span>
          </button>
        </li>
        {/* View Items Link */}
        <li className="nav-item">
          <NavLink to="/view-items" className="nav-link" title="View Items">
            <i className="fas fa-list icon-cyan"></i>
            <span className="ms-2">View Items</span>
          </NavLink>
        </li>
        {/* Logout Button */}
        <li className="nav-item">
          <button onClick={handleLogout} className="nav-link btn btn-link" title="Logout">
            <i className="fas fa-sign-out-alt icon-cyan"></i>
            <span className="ms-2">Logout</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

// Define PropTypes for Sidebar
Sidebar.propTypes = {
  handleLogout: PropTypes.func.isRequired,
  handleChangeItem: PropTypes.func.isRequired,
};

/**
 * WarningBox Component
 * Displays a modal overlay with a warning message before proceeding.
 * 
 * @param {Function} onProceed - Callback when user chooses to proceed.
 * @param {Function} onGoBack - Callback when user chooses to go back.
 */
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

// Define PropTypes for WarningBox
WarningBox.propTypes = {
  onProceed: PropTypes.func.isRequired,
  onGoBack: PropTypes.func.isRequired,
};

/**
 * LandingPage Component
 * The home page of the application where users can start adding new items or view existing ones.
 * 
 * @param {Function} handleNewItem - Function to handle new item creation.
 */
function LandingPage({ handleNewItem }) {
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();

  /**
   * Handles the click event for creating a new item.
   * Prevents default navigation and shows the warning modal instead.
   * 
   * @param {Object} e - Event object.
   */
  const handleNewItemClick = (e) => {
    e.preventDefault();
    setShowWarning(true);  // Show the warning modal
    console.log('New Item button clicked. Showing warning modal.');
  };

  /**
   * Handles the user's decision to proceed with creating a new item.
   * Generates a new item ID, updates state, and navigates to the NewItemPage.
   */
  const handleProceed = () => {
    setShowWarning(false);
    handleNewItem();
  };

  /**
   * Handles the user's decision to cancel creating a new item.
   * Closes the warning modal without making any changes.
   */
  const handleGoBack = () => {
    setShowWarning(false);
    console.log('User canceled creating a new item.');
  };

  return (
    <div className="landing-page container">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          {/* Display the Moola-Matic Logo */}
          <img 
            src={moolaMaticLogo} 
            alt="Moola-Matic Logo" 
            className="img-fluid mb-4 square-to-circle" 
          />
          {/* Page Title */}
          <h1 className="display-4">Moola-Matic</h1>
          {/* Page Description */}
          <p className="lead mb-4">Turn your thrifty finds into a treasure trove of cold, hard cash!</p>
          {/* Action Buttons */}
          <div className="mb-4">
            <button onClick={handleNewItemClick} className="btn btn-primary-theme me-2 dark-red-glow">New Item</button>
            <NavLink to="/view-items" className="btn btn-secondary-theme cyan-glow">View Items</NavLink>
          </div>
          {/* Conditionally render the WarningBox modal */}
          {showWarning && <WarningBox onProceed={handleProceed} onGoBack={handleGoBack} />}
          {/* Informational Box */}
          <div className="info-box">
            <p>Are you sitting on a goldmine of garage sale goodies? Let Moola-Matic help you squeeze every last penny out of your dusty discoveries!</p>
            <p className="fst-italic">We're like a money-making time machine for your junk drawer!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Define PropTypes for LandingPage
LandingPage.propTypes = {
  handleNewItem: PropTypes.func.isRequired,
};

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in their child component tree, logs those errors, and displays a fallback UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * Update state so the next render shows the fallback UI.
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * You can also log the error to an error reporting service.
   */
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    // Here you can also send the error to a logging service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children; 
  }
}

// Define PropTypes for ErrorBoundary
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * App Component
 * The root component of the application that sets up routing, state management, and context persistence.
 */
function App() {
  const [currentItemId, setCurrentItemId] = useState(null);
  const [mostRecentItemId, setMostRecentItemId] = useState(() => {
    return localStorage.getItem('mostRecentItemId') || null;
  });
  const navigate = useNavigate();

  // Add this function to handle logout
  const handleLogout = () => {
    // Implement your logout logic here
    // For example:
    // Clear any user-related data from localStorage
    localStorage.removeItem('mostRecentItemId');
    // Reset state
    setCurrentItemId(null);
    setMostRecentItemId(null);
    // Navigate to the home page or login page
    navigate('/');
  };

  useEffect(() => {
    if (mostRecentItemId) {
      localStorage.setItem('mostRecentItemId', mostRecentItemId);
    }
  }, [mostRecentItemId]);

  const handleNewItem = () => {
    const newItemId = `draft-${uuidv4()}`;
    setCurrentItemId(newItemId);
    setMostRecentItemId(newItemId);
    navigate(`/new-item/${newItemId}`);
  };

  const handleChangeItem = () => {
    if (mostRecentItemId) {
      setCurrentItemId(mostRecentItemId);
      navigate(`/new-item/${mostRecentItemId}`);
    } else {
      handleNewItem();
    }
  };

  return (
    <ErrorBoundary>
      <div className="app d-flex">
        {/* Sidebar Navigation */}
        <Sidebar handleLogout={handleLogout} handleChangeItem={handleChangeItem} />
        {/* Main Content Area */}
        <main className="flex-grow-1 p-3">
          <Routes>
            {/* Home/Landing Page Route */}
            <Route path="/" element={<LandingPage handleNewItem={handleNewItem} />} />
            {/* New Item Page Route */}
            <Route 
              path="/new-item/:itemId" 
              element={
                <NewItemPage 
                  setMostRecentItemId={setMostRecentItemId}
                  currentItemId={currentItemId}
                />
              } 
            />
            {/* View Items Page Route */}
            <Route path="/view-items" element={<ViewItemsPage />} />
            {/* Fallback Route - Redirects to LandingPage */}
            <Route path="*" element={<LandingPage handleNewItem={handleNewItem} />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
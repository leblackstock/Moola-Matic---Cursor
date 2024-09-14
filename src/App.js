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

/**
 * Sidebar Component
 * Renders the navigation sidebar with links to different routes.
 */
function Sidebar({ handleLogout }) {
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
          <NavLink to="/new-item" className="nav-link" title="Change Item">
            <i className="fas fa-plus-circle icon-cyan"></i>
            <span className="ms-2">Change Item</span>
          </NavLink>
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
 * @param {Function} setNewItemCreated - Function to update the newItemCreated state.
 * @param {Function} setItemId - Function to update the itemId state.
 */
function LandingPage({ setNewItemCreated, setItemId }) {
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
    setNewItemCreated(true);
    const newItemId = Math.floor(Math.random() * 1000000).toString();
    setItemId(newItemId);
    console.log(`Navigating to /new-item with itemId: ${newItemId}`);
    navigate('/new-item');
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
  setNewItemCreated: PropTypes.func.isRequired,
  setItemId: PropTypes.func.isRequired,
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
  // State to track if a new item has been created
  const [newItemCreated, setNewItemCreated] = useState(() => {
    // Initialize from localStorage, default to false if not set
    const storedValue = localStorage.getItem('newItemCreated');
    return storedValue ? JSON.parse(storedValue) : false;
  });

  // State to store the current item ID
  const [itemId, setItemId] = useState(() => {
    // Initialize from localStorage, default to '0' if not set
    return localStorage.getItem('itemId') || '0';
  });

  const navigate = useNavigate(); // Now inside Router context

  /**
   * Effect to synchronize newItemCreated state with localStorage.
   */
  useEffect(() => {
    try {
      localStorage.setItem('newItemCreated', JSON.stringify(newItemCreated));
      console.log(`newItemCreated updated to: ${newItemCreated}`);
    } catch (error) {
      console.error('Failed to update newItemCreated in localStorage:', error);
    }
  }, [newItemCreated]);

  /**
   * Effect to synchronize itemId state with localStorage.
   */
  useEffect(() => {
    try {
      localStorage.setItem('itemId', itemId);
      console.log(`itemId updated to: ${itemId}`);
    } catch (error) {
      console.error('Failed to update itemId in localStorage:', error);
    }
  }, [itemId]);

  /**
   * Effect for debugging: Logs whether essential styles are loaded.
   * You can remove this in production.
   */
  useEffect(() => {
    try {
      const stylesLoaded = {
        bootstrap: !!document.querySelector('link[href*="bootstrap"]'),
        fontawesome: !!document.querySelector('link[href*="fontawesome"]'),
        appCss: !!document.querySelector('link[href*="App.css"]')
      };
      console.log('Styles loaded:', stylesLoaded);
    } catch (error) {
      console.error('Error checking loaded styles:', error);
    }
  }, []);

  /**
   * Effect for debugging: Logs when the App component renders.
   * You can remove or comment this out in production.
   */
  useEffect(() => {
    console.log('App component is rendering');
  });

  /**
   * Handles user logout by calling the backend logout endpoint
   * and resetting frontend state as necessary.
   */
  const handleLogout = async () => {
    try {
      const response = await fetch(`http://localhost:${process.env.REACT_APP_BACKEND_PORT || 3001}/api/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Logout failed');
      }

      const data = await response.json();
      console.log(data.message);

      // Reset frontend state if necessary
      setNewItemCreated(false);
      setItemId('0');

      // Redirect to Landing Page
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <ErrorBoundary>
      <div className="app d-flex">
        {/* Sidebar Navigation */}
        <Sidebar handleLogout={handleLogout} />
        {/* Main Content Area */}
        <main className="flex-grow-1 p-3">
          <Routes>
            {/* Home/Landing Page Route */}
            <Route path="/" element={<LandingPage setNewItemCreated={setNewItemCreated} setItemId={setItemId} />} />
            {/* New Item Page Route */}
            <Route path="/new-item" element={<NewItemPage setNewItemCreated={setNewItemCreated} itemId={itemId} />} />
            {/* View Items Page Route */}
            <Route path="/view-items" element={<ViewItemsPage newItemCreated={newItemCreated} setNewItemCreated={setNewItemCreated} />} />
            {/* Fallback Route - Redirects to LandingPage */}
            <Route path="*" element={<LandingPage setNewItemCreated={setNewItemCreated} setItemId={setItemId} />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;

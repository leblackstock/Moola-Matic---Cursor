// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { Route, Routes, Link, NavLink, useNavigate } from 'react-router-dom'; // Removed BrowserRouter
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import moolaMaticLogo from './Images/Moola-Matic Logo 01.jpeg';
import NewItemPage from './NewItemPage.js'; // Ensure correct path and extension
import ViewItemsPage from './ViewItemsPage.js'; // Ensure correct path and extension
import { v4 as uuidv4 } from 'uuid';
import { handleNewItem, handleLocalSave } from './components/compSave.js'; // Import functions from compSave
import { 
  PageContainer, 
  StyledButton, 
  StyledLogo, 
  StyledTitle, 
  StyledSubtitle,
  GlowingButton,
  StyledContainer,
  ModalOverlay,
  ModalContent,
  ModalButton
} from './components/compStyles.js';

// Export the UUID generation function
export const generateItemId = () => `draft-${uuidv4()}`;

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
            <i className="fas fa-home icon-teal"></i>
            <span className="ms-2">Home</span>
          </NavLink>
        </li>
        {/* New Item Link */}
        <li className="nav-item">
          <button onClick={handleChangeItem} className="nav-link btn btn-link" title="Change Item">
            <i className="fas fa-plus-circle icon-teal"></i>
            <span className="ms-2">Change Item</span>
          </button>
        </li>
        {/* View Items Link */}
        <li className="nav-item">
          <NavLink to="/view-items" className="nav-link" title="View Items">
            <i className="fas fa-list icon-teal"></i>
            <span className="ms-2">View Items</span>
          </NavLink>
        </li>
        {/* Logout Button */}
        <li className="nav-item">
          <button onClick={handleLogout} className="nav-link btn btn-link" title="Logout">
            <i className="fas fa-sign-out-alt icon-teal"></i>
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
    <ModalOverlay>
      <ModalContent>
        <StyledTitle>Whoa there, bargain hunter!</StyledTitle>
        <StyledSubtitle>Are you sure you want to embark on a new treasure hunt? Any unsaved progress on your current item will vanish faster than a yard sale deal!</StyledSubtitle>
        <div>
          <ModalButton onClick={onProceed}>Let's do this!</ModalButton>
          <ModalButton onClick={onGoBack}>Oops, nevermind!</ModalButton>
        </div>
      </ModalContent>
    </ModalOverlay>
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
 */
function LandingPage({ handleNewItem, setCurrentItemId, setMostRecentItemId }) {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  const handleNewItemClick = () => {
    setShowWarning(true);
  };

  const handleProceed = () => {
    setShowWarning(false);
    // Clear all unsaved variables
    setCurrentItemId(null);
    setMostRecentItemId(null);
    localStorage.clear();
    sessionStorage.clear();
    
    // Create a new itemId and navigate to NewItemPage
    const newItemId = handleNewItem();
    navigate(`/new-item/${newItemId}`);
  };

  const handleGoBack = () => {
    setShowWarning(false);
  };

  return (
    <StyledContainer>
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          {/* Display the Moola-Matic Logo */}
          <StyledLogo 
            src={moolaMaticLogo} 
            alt="Moola-Matic Logo" 
            className="square-to-circle" 
          />
          <StyledTitle>Moola-Matic</StyledTitle>
          <StyledSubtitle>Turn your thrifty finds into a treasure trove of cold, hard cash!</StyledSubtitle>
          <div className="mb-4">
            <GlowingButton onClick={handleNewItemClick} className="me-2 dark-red-glow">New Item</GlowingButton>
            <GlowingButton as={NavLink} to="/view-items" className="cyan-glow">View Items</GlowingButton>
          </div>
          {showWarning && (
            <WarningBox onProceed={handleProceed} onGoBack={handleGoBack} />
          )}
          <div className="info-box">
            <p>Are you sitting on a goldmine of garage sale goodies? Let Moola-Matic help you squeeze every last penny out of your dusty discoveries!</p>
            <p className="fst-italic">We're like a money-making time machine for your junk drawer!</p>
          </div>
        </div>
      </div>
    </StyledContainer>
  );
}

// Update PropTypes
LandingPage.propTypes = {
  handleNewItem: PropTypes.func.isRequired,
  setCurrentItemId: PropTypes.func.isRequired,
  setMostRecentItemId: PropTypes.func.isRequired,
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
  return <AppContent />;
}

function AppContent() {
  const [currentItemId, setCurrentItemId] = useState(null);
  const [mostRecentItemId, setMostRecentItemId] = useState(null);
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

  const handleNewItemClick = () => {
    console.log('handleNewItemClick: Creating new item');
    // Clear all unsaved variables
    setCurrentItemId(null);
    setMostRecentItemId(null);
    localStorage.clear(); // This clears all localStorage items
    sessionStorage.clear(); // Clear any session storage as well
    
    // Create a new itemId
    const newItemId = generateItemId();
    setCurrentItemId(newItemId);
    setMostRecentItemId(newItemId);
    
    // Navigate to the new item page
    navigate(`/new-item/${newItemId}`);
    
    console.log('handleNewItemClick: New item created with ID:', newItemId);
    
    return newItemId;
  };

  const handleChangeItem = () => {
    if (mostRecentItemId) {
      setCurrentItemId(mostRecentItemId);
      navigate(`/new-item/${mostRecentItemId}`);
    } else {
      handleNewItemClick();
    }
  };

  useEffect(() => {
    console.log('App: currentItemId changed to:', currentItemId);
  }, [currentItemId]);

  return (
    <ErrorBoundary>
      <PageContainer>
        <Sidebar handleLogout={handleLogout} handleChangeItem={handleChangeItem} />
        <main className="flex-grow-1 p-3">
          <Routes>
            <Route path="/" element={
              <LandingPage 
                handleNewItem={handleNewItemClick} 
                setCurrentItemId={setCurrentItemId} 
                setMostRecentItemId={setMostRecentItemId} 
              />
            } />
            <Route 
              path="/new-item" 
              element={
                <NewItemPage 
                  setMostRecentItemId={setMostRecentItemId} 
                  currentItemId={currentItemId} 
                />
              } 
            />
            <Route 
              path="/new-item/:itemId" 
              element={
                <NewItemPage 
                  setMostRecentItemId={setMostRecentItemId} 
                  currentItemId={currentItemId} 
                />
              } 
            />
            <Route path="/view-items" element={<ViewItemsPage />} />
          </Routes>
        </main>
      </PageContainer>
    </ErrorBoundary>
  );
}

export default App;
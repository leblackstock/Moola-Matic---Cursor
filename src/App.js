// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { Route, Routes, useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import moolaMaticLogo from './Images/Moola-Matic Logo 01.jpeg';
import NewItemPage from './NewItemPage.js';
import ViewItemsPage from './ViewItemsPage.js';
import { v4 as uuidv4 } from 'uuid';
import { handleNewItem, handleLocalSave } from './components/compSave.js';
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
  ModalButton,
  Sidebar as StyledSidebar,
  NavLink,
  WarningBoxOverlay,
  WarningBox,
  WarningBoxButtons,
  WarningButton, // Add this line
  LogoContainer,
  Logo,
  MainContent,
  ButtonContainer,
} from './components/compStyles.js';

// Export the UUID generation function
export const generateItemId = () => `draft-${uuidv4()}`;

/**
 * Sidebar Component
 * Renders the navigation sidebar with links to different routes.
 */
function Sidebar({ handleLogout, handleChangeItem }) {
  return (
    <StyledSidebar>
      <NavLink as={Link} to="/" end="true" title="Home">
        <i className="fas fa-home"></i>
        <span>Home</span>
      </NavLink>
      <NavLink as="button" onClick={handleChangeItem} title="Change Item">
        <i className="fas fa-plus-circle"></i>
        <span>Change Item</span>
      </NavLink>
      <NavLink as={Link} to="/view-items" title="View Items">
        <i className="fas fa-list"></i>
        <span>View Items</span>
      </NavLink>
      <NavLink as="button" onClick={handleLogout} title="Logout">
        <i className="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </NavLink>
    </StyledSidebar>
  );
}

// Define PropTypes for Sidebar
Sidebar.propTypes = {
  handleLogout: PropTypes.func.isRequired,
  handleChangeItem: PropTypes.func.isRequired,
};

/**
 * WarningBoxModal Component
 * Displays a modal overlay with a warning message before proceeding.
 *
 * @param {Function} onProceed - Callback when user chooses to proceed.
 * @param {Function} onGoBack - Callback when user chooses to go back.
 */
function WarningBoxModal({ onProceed, onGoBack }) {
  return (
    <WarningBoxOverlay>
      <WarningBox>
        <StyledTitle>Whoa there, bargain hunter!</StyledTitle>
        <StyledSubtitle>
          Are you sure you want to embark on a new treasure hunt? Any unsaved
          progress on your current item will vanish faster than a yard sale
          deal!
        </StyledSubtitle>
        <WarningBoxButtons>
          <WarningButton className="proceed" onClick={onProceed}>
            Let's do this!
          </WarningButton>
          <WarningButton onClick={onGoBack}>Oops, nevermind!</WarningButton>
        </WarningBoxButtons>
      </WarningBox>
    </WarningBoxOverlay>
  );
}

// Define PropTypes for WarningBoxModal
WarningBoxModal.propTypes = {
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
    console.log('handleProceed: User confirmed, creating new item');
    setShowWarning(false);
    
    // Clear all unsaved variables
    setCurrentItemId(null);
    setMostRecentItemId(null);
    localStorage.clear();
    sessionStorage.clear();

    // Create a new itemId
    const newItemId = generateItemId();
    console.log('handleProceed: Generated new itemId:', newItemId);
    setCurrentItemId(newItemId);
    setMostRecentItemId(newItemId);

    // Navigate to the new item page
    console.log('handleProceed: Navigating to:', `/new-item/${newItemId}`);
    navigate(`/new-item/${newItemId}`);
  };

  const handleGoBack = () => {
    setShowWarning(false);
  };

  return (
    <StyledContainer>
      <div>
        <LogoContainer>
          <Logo src={moolaMaticLogo} alt="Moola-Matic Logo" />
        </LogoContainer>
        <StyledTitle>Moola-Matic</StyledTitle>
        <StyledSubtitle>
          Turn your thrifty finds into a treasure trove of cold, hard cash!
        </StyledSubtitle>
        <ButtonContainer>
          <GlowingButton onClick={handleNewItemClick}>New Item</GlowingButton>
          <GlowingButton as={Link} to="/view-items">
            View Items
          </GlowingButton>
        </ButtonContainer>
        {showWarning && (
          <WarningBoxModal onProceed={handleProceed} onGoBack={handleGoBack} />
        )}
        <div>
          <p>
            Are you sitting on a goldmine of garage sale goodies? Let
            Moola-Matic help you squeeze every last penny out of your dusty
            discoveries!
          </p>
          <p>We're like a money-making time machine for your junk drawer!</p>
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
 * NotFound Component
 * Displays a 404 error page when a route is not found.
 */
function NotFound() {
  return (
    <StyledContainer>
      <StyledTitle>404 - Page Not Found</StyledTitle>
      <StyledSubtitle>
        Oops! It looks like this page has vanished like a yard sale bargain.
      </StyledSubtitle>
      <p>Don't worry, there are still plenty of treasures to be found!</p>
      <GlowingButton as={Link} to="/">
        Return to Home
      </GlowingButton>
    </StyledContainer>
  );
}

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
        <Sidebar
          handleLogout={handleLogout}
          handleChangeItem={handleChangeItem}
        />
        <MainContent>
          <Routes>
            <Route
              path="/"
              element={
                <LandingPage
                  handleNewItem={handleNewItemClick}
                  setCurrentItemId={setCurrentItemId}
                  setMostRecentItemId={setMostRecentItemId}
                />
              }
            />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainContent>
      </PageContainer>
    </ErrorBoundary>
  );
}

export default App;

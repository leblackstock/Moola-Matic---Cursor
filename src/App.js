// frontend/src/App.js

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Route, Routes, useNavigate, Link, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';
import moolaMaticLogo from './Images/Moola-Matic Logo 01.jpeg';
import NewItemPage from './NewItemPage.js';
import ViewItemsPage from './ViewItemsPage.js';
//import { handleLocalSave, saveToLocalStorage } from './components/compSave.js';
import { resetItemGeneration, createNewItem } from './helpers/itemGen.js';
import 'react-toastify/dist/ReactToastify.css';
import {
  PageContainer,
  StyledTitle,
  StyledSubtitle,
  GlowingButton,
  StyledContainer,
  Sidebar as StyledSidebar,
  NavLink,
  WarningBoxOverlay,
  WarningBox,
  WarningBoxButtons,
  WarningButton,
  LogoContainer,
  Logo,
  MainContent,
  ButtonContainer,
  StyledToastContainer,
} from './components/compStyles.js';
import GlobalStyles from './GlobalStyles.js';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCamera,
  faPlus,
  faTrash,
  faEdit,
  faSave,
  faUpload,
  faSearch,
  faSort,
  faFilter,
  faUser,
  faSignIn,
  faSignOut,
  faDollarSign,
  faTag,
  faImage,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

library.add(
  faCamera,
  faPlus,
  faTrash,
  faEdit,
  faSave,
  faUpload,
  faSearch,
  faSort,
  faFilter,
  faUser,
  faSignIn,
  faSignOut,
  faDollarSign,
  faTag,
  faImage,
  faInfoCircle
);

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
          Are you sure you want to embark on a new treasure hunt? Any unsaved progress on your
          current item will vanish faster than a yard sale deal!
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
function LandingPage({ setItemId }) {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  const handleNewItemClick = () => {
    setShowWarning(true);
  };

  const handleGoBack = () => {
    setShowWarning(false);
  };

  // Add this function to check if an item exists in localStorage
  const checkItemInLocalStorage = itemId => {
    const item = localStorage.getItem(`item_${itemId}`);
    return item !== null;
  };

  const handleProceed = async () => {
    console.log('handleProceed: User confirmed, creating new item');
    setShowWarning(false);

    // Clear all unsaved variables
    setItemId(null);
    localStorage.clear();
    sessionStorage.clear();

    // Reset the item generation state
    resetItemGeneration();

    try {
      // Create a new item using the centralized function
      const newItemId = await createNewItem();
      console.log('handleProceed: New item created with ID:', newItemId);

      // Set the new ItemId
      setItemId(newItemId);

      // Check if the item exists in localStorage
      const itemExists = checkItemInLocalStorage(newItemId);
      if (itemExists) {
        console.log('Item found in localStorage. Proceeding with navigation.');
        console.log('About to navigate...');
        // Navigate to the new item page
        navigate(`/new-item/${newItemId}`);
        console.log('Navigation called');
      } else {
        console.error('Item not found in localStorage. Navigation aborted.');
        // Handle the error appropriately, maybe show an error message to the user
      }
    } catch (error) {
      console.error('Error creating new item:', error);
      // Handle the error appropriately
    }
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
        {showWarning && <WarningBoxModal onProceed={handleProceed} onGoBack={handleGoBack} />}
        <div>
          <p>
            Are you sitting on a goldmine of garage sale goodies? Let Moola-Matic help you squeeze
            every last penny out of your dusty discoveries!
          </p>
          <p>We're like a money-making time machine for your junk drawer!</p>
        </div>
      </div>
    </StyledContainer>
  );
}

// Update PropTypes
LandingPage.propTypes = {
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
  const [currentItemId, setCurrentItemId] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const navigate = useNavigate();

  // Add this new function to handle setting currentItemId when saving items
  const handleItemSaved = itemId => {
    console.log('Item saved, setting currentItemId:', itemId);
    setCurrentItemId(itemId);
  };

  const handleLogout = () => {
    setCurrentItemId(null);
    localStorage.removeItem('currentItemId');
  };

  const handleChangeItem = () => {
    if (currentItemId) {
      navigate(`/new-item/${currentItemId}`);
    } else {
      navigate('/');
    }
  };

  const handleSetItemId = newItemId => {
    console.log('Setting new ItemId:', newItemId);
    setCurrentItemId(newItemId);
    // Load the item data from localStorage
    const itemData = localStorage.getItem(`item_${newItemId}`);
    if (itemData) {
      setCurrentItem(JSON.parse(itemData));
    } else {
      setCurrentItem(null);
    }
    navigate(`/new-item/${newItemId}`); // Add this line to navigate after setting the item ID
  };

  return (
    <div className="App">
      <GlobalStyles />
      <ErrorBoundary>
        <PageContainer>
          <Sidebar handleLogout={handleLogout} handleChangeItem={handleChangeItem} />
          <MainContent>
            <Routes>
              <Route path="/" element={<LandingPage setItemId={handleSetItemId} />} />
              <Route
                path="/new-item"
                element={
                  currentItemId ? (
                    <NewItemPage
                      itemId={currentItemId}
                      setItemId={handleSetItemId}
                      item={currentItem}
                      setItem={setCurrentItem}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/new-item/:itemId"
                element={
                  <NewItemPage
                    itemId={currentItemId || ''}
                    item={currentItem}
                    setItem={setCurrentItem}
                    onItemSaved={handleItemSaved}
                  />
                }
              />
              <Route path="/view-items" element={<ViewItemsPage currentItemId={currentItemId} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainContent>
        </PageContainer>
      </ErrorBoundary>
      <StyledToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;

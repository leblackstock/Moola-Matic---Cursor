// frontend/src/GlobalStyles.js

import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Open Sans', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
    text-align: center;
    color: #F5DEB3;
    background: linear-gradient(45deg, #0D001A, #1A0022, #2D0037);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
  }

  #root {
    min-height: 100vh;
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: 20px;
    font-weight: bold;
  }

  h1 { font-size: 2.5em; }
  h2 { font-size: 2em; }
  h3 { font-size: 1.75em; }
  h4 { font-size: 1.5em; }
  h5 { font-size: 1.25em; }
  h6 { font-size: 1em; }

  p {
    margin-bottom: 15px;
    line-height: 1.5;
  }

  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  /* Utility Classes */
  .mb-4 { margin-bottom: 1.5rem; }
  .mt-4 { margin-top: 1.5rem; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .d-flex { display: flex; }
  .justify-content-between { justify-content: space-between; }
  .align-items-center { align-items: center; }
  
  /* Toast Styles */
  .Toastify__toast-container {
    z-index: 9999;
  }

  .Toastify__toast {
    background: rgba(13, 0, 26, 0.9);
    color: #f5deb3;
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.4);
    border: 2px solid #4a0e4e;
    font-family: 'Open Sans', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  }

  .Toastify__toast-body {
    font-size: 14px;
    line-height: 1.5;
  }

  .Toastify__progress-bar {
    background: linear-gradient(to right, #f5deb3, #00ffff);
    height: 3px;
  }

  .Toastify__close-button {
    color: #f5deb3;
    opacity: 0.7;
    transition: all 0.3s ease;
  }

  .Toastify__close-button:hover {
    color: #00ffff;
    opacity: 1;
  }

  .Toastify__toast--success {
    background: linear-gradient(45deg, #2d0037, #4a0e4e);
  }

  .Toastify__toast--error {
    background: linear-gradient(45deg, #8b0000, #4a0e4e);
  }

  .Toastify__toast--warning {
    background: linear-gradient(45deg, #ffa500, #4a0e4e);
  }

  .Toastify__toast--info {
    background: linear-gradient(45deg, #00ced1, #4a0e4e);
  }

  .Toastify__toast-icon {
    color: #00ffff;
  }

  @media (max-width: 768px) {
    .Toastify__toast-container {
      width: 90%;
      padding: 0;
      left: 5%;
      margin: 0;
    }
  }
`;

export default GlobalStyles;

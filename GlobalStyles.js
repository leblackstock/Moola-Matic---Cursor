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
`;

export default GlobalStyles;

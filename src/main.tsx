import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@emotion/react';
import App from './App';
import theme from './theme';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { MemoryRouter } from 'react-router-dom'

// @ts-ignore
Number.prototype.mod = function (n) {
  "use strict";
  // @ts-ignore
  return ((this % n) + n) % n;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <HashRouter>
      <App />
    </HashRouter>
  </>,
);

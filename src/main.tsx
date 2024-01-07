import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@emotion/react';
import App from './App';
import theme from './theme';
import { BrowserRouter } from 'react-router-dom';
import { MemoryRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <MemoryRouter>
      <App />
    </MemoryRouter>
  </>,
);

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/pages/App';
import { FrontStateProvider } from '../src/hooks/useFrontState';
import './index.css';

const container = document.querySelector('#root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <FrontStateProvider>
      <App />
    </FrontStateProvider>
  </React.StrictMode>
);

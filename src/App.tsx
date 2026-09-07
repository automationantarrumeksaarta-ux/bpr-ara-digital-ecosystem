import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppRouter } from './app/routes';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </BrowserRouter>
  );
}

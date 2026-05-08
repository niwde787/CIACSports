import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // CRITICAL: Mandatory for Tailwind CSS v4 styles
import App from './App';

// Add error catching early to catch global/module level errors
window.addEventListener('error', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.right = '0';
  errorDiv.style.backgroundColor = 'red';
  errorDiv.style.color = 'white';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.padding = '20px';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.innerHTML = `<h3>Uncaught Error</h3><pre>${event.error?.stack || event.message}</pre>`;
  document.body.appendChild(errorDiv);
  
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    splashScreen.style.display = 'none';
  }
});

// Add unhandled promise rejection catching
window.addEventListener('unhandledrejection', (event) => {
   const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.right = '0';
  errorDiv.style.backgroundColor = 'orange';
  errorDiv.style.color = 'black';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.padding = '20px';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.innerHTML = `<h3>Unhandled Promise Rejection</h3><pre>${event.reason?.stack || event.reason}</pre>`;
  document.body.appendChild(errorDiv);
  
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    splashScreen.style.display = 'none';
  }
});

const rootElement = document.getElementById('root');
const splashScreen = document.getElementById('splash-screen');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Add logic to hide splash screen after app is mounted
if (splashScreen) {
  setTimeout(() => {
    splashScreen.classList.add('fade-out');
    setTimeout(() => {
      splashScreen.style.display = 'none';
    }, 500);
  }, 500);
}

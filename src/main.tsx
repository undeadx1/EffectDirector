/**
 * Application entry point
 * Initializes React and renders the root component
 */
import ReactDOM from 'react-dom/client';
import App from './App';

// Create and render root component
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
);

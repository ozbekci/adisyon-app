import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './index.css';
import { HashRouter } from 'react-router-dom';

// Set DaisyUI theme and enable dark mode background
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', 'adisyon');
  document.documentElement.classList.add('dark');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter>
        <div className="min-h-screen app-shell text-white">
          <App />
        </div>
      </HashRouter>
    </Provider>
  </React.StrictMode>
);

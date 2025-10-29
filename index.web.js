// Import React and ReactDOM from bundled modules
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌐 DOM Content Loaded');
  
  const rootElement = document.getElementById('root');
  console.log('🎯 Root element found:', !!rootElement);
  
  if (!rootElement) {
    console.error('❌ Root element not found!');
    document.body.innerHTML = '<div style="padding: 20px; color: red; font-size: 18px;">❌ Error: Root element not found. Please check the HTML template.</div>';
    return;
  }
  
  console.log('⚛️ Using bundled React and ReactDOM');
  
  try {
    console.log('⚛️ Creating React root');
    const root = ReactDOM.createRoot(rootElement);
    
    console.log('🎨 Rendering App');
    root.render(React.createElement(App));
    
    console.log('✅ React app rendered successfully');
  } catch (renderError) {
    console.error('❌ Error rendering React app:', renderError);
    rootElement.innerHTML = '<div style="padding: 20px; color: red;">❌ Error rendering app: ' + renderError.message + '</div>';
  }
});
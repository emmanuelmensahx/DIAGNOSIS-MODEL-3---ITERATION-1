// simple-index.web.js - Simple entry point for testing CDN externals
import SimpleApp from './SimpleApp';

// Wait for React and ReactDOM to be available from CDN
function waitForReact(callback, timeout = 10000) {
  const startTime = Date.now();
  
  function checkReact() {
    if (window.React && window.ReactDOM) {
      callback();
    } else if (Date.now() - startTime < timeout) {
      setTimeout(checkReact, 100);
    } else {
      console.error('React and ReactDOM not loaded within timeout period');
    }
  }
  
  checkReact();
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, waiting for React...');
  
  waitForReact(() => {
    console.log('React and ReactDOM are available');
    
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Root element not found');
      return;
    }
    
    // Create React root and render the app
    const root = window.ReactDOM.createRoot(rootElement);
    const appElement = window.React.createElement(SimpleApp);
    root.render(appElement);
    
    console.log('SimpleApp rendered successfully');
  });
});
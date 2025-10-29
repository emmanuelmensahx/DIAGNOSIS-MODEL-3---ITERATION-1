// Function to wait for React to be available (using callbacks)
function waitForReact(callback) {
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds max
  
  function checkReact() {
    attempts++;
    console.log('🔍 Checking for React (attempt ' + attempts + ')');
    
    if (window.React && window.ReactDOM) {
      console.log('✅ React and ReactDOM are available');
      callback(null, { React: window.React, ReactDOM: window.ReactDOM });
    } else if (attempts >= maxAttempts) {
      callback(new Error('React CDN failed to load'));
    } else {
      setTimeout(checkReact, 100);
    }
  }
  
  checkReact();
}

// Simple test component factory
function createTestApp(React) {
  return function TestApp() {
    console.log('🎯 TestApp component rendering');
    return React.createElement('div', {
      style: { padding: '20px', textAlign: 'center' }
    }, [
      React.createElement('h1', { key: 'title' }, '✅ React is Working!'),
      React.createElement('p', { key: 'desc' }, 'The ReactCurrentDispatcher error has been resolved.'),
      React.createElement('button', { 
        key: 'btn',
        onClick: function() { alert('React event handling works!'); }
      }, 'Test Click')
    ]);
  };
}

// Wait for DOM and React to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM Content Loaded');
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ Root element not found');
    return;
  }

  console.log('⏳ Waiting for React CDN to load...');
  waitForReact(function(error, libs) {
    if (error) {
      console.error('❌ Error loading React:', error);
      return;
    }
    
    try {
      const React = libs.React;
      const ReactDOM = libs.ReactDOM;
      
      console.log('⚛️ Creating React root');
      const root = ReactDOM.createRoot(rootElement);
      
      console.log('🎨 Rendering Test App');
      const TestApp = createTestApp(React);
      root.render(React.createElement(TestApp));
      
      console.log('✅ React test app rendered successfully');
    } catch (renderError) {
      console.error('❌ Error rendering React app:', renderError);
    }
  });
});
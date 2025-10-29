// Enhanced exports shim for CommonJS compatibility
const exportsShim = {};

// Provide logger functionality for webpack-dev-server
exportsShim.configureDefaultLogger = function() {
  return {
    info: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
    log: console.log.bind(console)
  };
};

// Basic exports object
Object.assign(exportsShim, {
  default: exportsShim,
  __esModule: true
});

module.exports = exportsShim;
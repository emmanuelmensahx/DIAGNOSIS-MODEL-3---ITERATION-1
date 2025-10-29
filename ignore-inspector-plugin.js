class IgnoreInspectorPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('IgnoreInspectorPlugin', (factory) => {
      factory.hooks.beforeResolve.tap('IgnoreInspectorPlugin', (resolveData) => {
        if (!resolveData) return;
        
        const request = resolveData.request;
        const context = resolveData.context;
        
        // Ignore any Inspector-related imports
        if (request && (
          request.includes('Inspector') ||
          request.includes('react-native/Libraries/Inspector') ||
          (request === '../Utilities/Platform' && context && context.includes('Inspector'))
        )) {
          return false; // Don't resolve this module
        }
        
        // Don't return resolveData, just modify it in place or return undefined
      });
    });
  }
}

module.exports = IgnoreInspectorPlugin;
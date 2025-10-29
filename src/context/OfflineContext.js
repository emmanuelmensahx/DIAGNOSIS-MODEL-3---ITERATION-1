import React from 'react';

// Create the Offline Context
const OfflineContext = React.createContext({
  isOffline: false,
  syncData: () => {},
});

// Create provider and consumer hooks
export const OfflineProvider = OfflineContext.Provider;
export const useOffline = () => React.useContext(OfflineContext);

export default OfflineContext;
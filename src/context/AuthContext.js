import React from 'react';

// Create the Auth Context
const AuthContext = React.createContext({
  signIn: () => {},
  signOut: () => {},
  userToken: null,
});

// Create provider and consumer hooks
export const AuthProvider = AuthContext.Provider;
export const useAuth = () => React.useContext(AuthContext);

export default AuthContext;
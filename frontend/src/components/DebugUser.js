// frontend/src/components/DebugUser.js
import React from 'react';
import { useAuth } from '../context/AuthContext';

const DebugUser = () => {
  const { user } = useAuth();
  return (
    <pre style={{ background: '#eee', padding: '10px', maxHeight: '300px', overflow: 'auto' }}>
      {JSON.stringify(user, null, 2)}
    </pre>
  );
};

export default DebugUser;

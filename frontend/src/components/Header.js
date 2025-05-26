import React from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { Link } from 'react-router-dom'; // For profile link

function Header() {
  const { user, logout } = useAuth(); // Get user and logout function from AuthContext

  return (
    <header style={{ padding: '10px 20px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1>PulmoScanPro</h1>
      {user && ( // Only show if user is logged in
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '15px', fontWeight: 'bold' }}>
            Welcome, {user.username}! ({user.role ? user.role.toUpperCase() : 'N/A'}) {/* <--- CHANGE user.profile_role to user.role */}
          </span>
          <Link to="/profile" style={{ textDecoration: 'none', color: '#007bff', marginRight: '15px' }}>
           View Profile
          </Link>
          <button
            onClick={logout}
            style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;





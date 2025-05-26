import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div style={{ width: '250px', background: '#343a40', color: 'white', padding: '20px', flexShrink: 0 }}>
      <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>PulmoScanPro Menu</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '15px' }}>
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1em' }}>
            Dashboard
          </Link>
        </li>

        {(user.role === 'admin' || user.role === 'doctor') && (
          <>
            <li style={{ marginBottom: '15px' }}>
              <h3 style={{ color: '#adb5bd', fontSize: '0.9em', textTransform: 'uppercase', marginBottom: '10px' }}>Doctor</h3>
              <ul style={{ listStyle: 'none', paddingLeft: '15px' }}>
                <li style={{ marginBottom: '10px' }}>
                  <Link to="/doctor/scan-upload" style={{ color: '#ced4da', textDecoration: 'none' }}>
                    Upload New Scan
                  </Link>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <Link to="/doctor/patients" style={{ color: '#ced4da', textDecoration: 'none' }}>
                    Patient Scan History
                  </Link>
                </li>
              </ul>
            </li>
          </>
        )}

        {(user.role === 'admin' || user.role === 'pharmacist') && (
          <>
            <li style={{ marginBottom: '15px' }}>
              <h3 style={{ color: '#adb5bd', fontSize: '0.9em', textTransform: 'uppercase', marginBottom: '10px' }}>Pharmacist</h3>
              <ul style={{ listStyle: 'none', paddingLeft: '15px' }}>
                <li style={{ marginBottom: '10px' }}>
                  <Link to="/pharmacist/medicines" style={{ color: '#ced4da', textDecoration: 'none' }}>
                    Manage Medicines
                  </Link>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <Link to="/pharmacist/transactions" style={{ color: '#ced4da', textDecoration: 'none' }}>
                    Inventory Transactions
                  </Link>
                </li>
              </ul>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;

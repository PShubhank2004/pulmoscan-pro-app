






















// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// ... other imports
import DashboardPage from './pages/DashboardPage';
import ScanUploadPage from './pages/Doctor/ScanUploadPage';
import PatientHistoryPage from './pages/Doctor/PatientHistoryPage';
import ScanReportDetail from './pages/Doctor/ScanReportDetail';
import MedicineListPage from './pages/Pharmacist/MedicineListPage';
import MedicineFormPage from './pages/Pharmacist/MedicineFormPage';
import InventoryTransactionPage from './pages/Pharmacist/InventoryTransactionPage';
import LoginPage from './components/LoginPage'; // Import the LoginPage
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import UserProfile from './components/UserProfile'; // <--- IMPORT USERPROFILE HERE!

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {user && <Sidebar />}
      <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
        {user && <Header />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
             

            {/* Add the UserProfile route here, inside PrivateRoute as it requires authentication */}
            <Route path="/profile" element={<UserProfile />} /> {/* <--- ADD THIS LINE! */}
            <Route element={<RoleBasedRoute allowedRoles={['admin', 'doctor']} />}>
              <Route path="/doctor/scan-upload" element={<ScanUploadPage />} />
              <Route path="/doctor/patients" element={<PatientHistoryPage />} />
              <Route path="/doctor/scan-reports/:id" element={<ScanReportDetail />} />
            </Route>

            <Route element={<RoleBasedRoute allowedRoles={['admin', 'pharmacist']} />}>
              <Route path="/pharmacist/medicines" element={<MedicineListPage />} />
              <Route path="/pharmacist/medicines/new" element={<MedicineFormPage />} />
              <Route path="/pharmacist/medicines/edit/:id" element={<MedicineFormPage />} />
              <Route path="/pharmacist/transactions" element={<InventoryTransactionPage />} />
            </Route>
          </Route>

          <Route path="/unauthorized" element={
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h1>Unauthorized Access</h1>
              <p>You do not have permission to view this page.</p>
              <Navigate to="/dashboard" />
            </div>
          } />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
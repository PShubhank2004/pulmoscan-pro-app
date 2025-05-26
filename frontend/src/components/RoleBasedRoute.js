import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const RoleBasedRoute = ({ allowedRoles }) => {
    const { user } = useAuth();
    if (!user) { return <Navigate to="/login" />; } // Redundant but harmless if nested
    const hasPermission = user.role && allowedRoles.includes(user.role);
    if (hasPermission) { return <Outlet />; }
    else { return <Navigate to="/unauthorized" />; }
};
export default RoleBasedRoute;
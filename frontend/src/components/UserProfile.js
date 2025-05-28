// src/components/UserProfile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Path to your AuthContext
import axiosInstance from '../utils/axiosInstance';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Container,
} from '@mui/material';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const UserProfile = () => {
    const { authTokens, user, logout } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!authTokens?.access) {
                setLoading(false);
                setError('No authentication token found. Please log in.');
                return;
            }
            if (!user?.user_id) { // Ensure user object and user_id are available
                setLoading(false);
                setError('User ID not found in token. Please log in again.');
                return;
            }

            try {
                // Corrected URL based on your Postman test result
                const response = await axiosInstance.get('user-profiles/', {
                    headers: {
                        Authorization: `Bearer ${authTokens.access}`,
                    },
                });

                // The API returns a list, so we need to find the current user's profile
                const allProfiles = response.data;
                const currentUserProfile = allProfiles.find(
                    (profile) => profile.user.id === user.user_id // Match by user ID from JWT
                );

                if (currentUserProfile) {
                    setProfileData(currentUserProfile);
                    setLoading(false);
                } else {
                    setError('Your user profile could not be found. Please contact support.');
                    setLoading(false);
                }

            } catch (err) {
                console.error('Error fetching profile:', err.response?.data || err.message);
                let errorMessage = 'Failed to load profile data. Please try logging in again.';
                if (err.response?.status === 401) {
                    errorMessage = 'Session expired or invalid. Please log in again.';
                    logout();
                } else if (err.response?.status === 403) {
                    errorMessage = 'You do not have permission to view this profile.';
                } else if (err.response?.data?.detail) {
                    errorMessage = err.response.data.detail;
                }
                setError(errorMessage);
                setLoading(false);
            }
        };

        if (authTokens && user) { // Also check for `user` here
            fetchProfile();
        } else {
            setLoading(false);
            setError('Please log in to view your profile.');
        }

    }, [authTokens, user, logout]); // Depend on user as well, since we use user.user_id

    // Render based on loading, error, or data
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
                <Typography ml={2}>Loading profile...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ mt: 5 }}>
                <Alert severity="error" sx={{ padding: 3 }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!profileData) {
        return (
            <Container maxWidth="sm" sx={{ mt: 5 }}>
                <Alert severity="info" sx={{ padding: 3 }}>
                    No profile data available.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 5 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>User Profile</Typography>
                <Typography variant="body1">
                    <strong>Username:</strong> {profileData.user?.username || 'N/A (from API)'}
                    {' '}({user?.username || 'N/A'})
                </Typography>
                <Typography variant="body1"><strong>Email:</strong> {profileData.user?.email || 'N/A'}</Typography>

                {/* Conditional rendering for First Name */}
                {profileData.user?.first_name && (
                    <Typography variant="body1"><strong>First Name:</strong> {profileData.user.first_name}</Typography>
                )}

                {/* Conditional rendering for Last Name */}
                {profileData.user?.last_name && (
                    <Typography variant="body1"><strong>Last Name:</strong> {profileData.user.last_name}</Typography>
                )}

                <Typography variant="body1">
                    <strong>Role:</strong> {profileData.role || 'N/A (from API)'}
                    {' '}({user?.role?.toUpperCase() || 'N/A'})
                </Typography>
                {/* Add any other profile details you retrieve */}
            </Paper>
        </Container>
    );
};

export default UserProfile;
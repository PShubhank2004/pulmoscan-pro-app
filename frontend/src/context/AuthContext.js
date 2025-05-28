// src/context/AuthContext.js

import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Ensure you have installed jwt-decode: npm install jwt-decode

const AuthContext = createContext();

export default AuthContext;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    // Initialize authTokens and user from localStorage if they exist
    // Use a function for initial state to prevent re-computation on every render
    let [authTokens, setAuthTokens] = useState(() =>
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );
    let [user, setUser] = useState(() => {
        const storedAuthTokens = localStorage.getItem('authTokens');
        if (storedAuthTokens) {
            try {
                const parsedTokens = JSON.parse(storedAuthTokens);
                if (parsedTokens.access) {
                    const decoded = jwtDecode(parsedTokens.access);
                    return {
                        user_id: decoded.user_id,
                        username: decoded.username,
                        email: decoded.email,
                        role: decoded.role,       // Extract the role
                        is_staff: decoded.is_staff // Extract is_staff
                    };
                }
            } catch (e) {
                console.error("Failed to decode token from localStorage:", e);
                localStorage.removeItem('authTokens'); // Clear invalid token
                return null;
            }
        }
        return null;
    });

    let [loading, setLoading] = useState(true); // Start as loading

    const loginUser = async (username, password) => { // Adjusted to take username, password
        try {
            const response = await fetch(`${API_BASE_URL}auth/token/`, { // Ensure this URL is correct
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            const data = await response.json();

            if (response.status === 200) {
                setAuthTokens(data);
                const decodedUser = jwtDecode(data.access);

                setUser({
                    user_id: decodedUser.user_id,
                    username: decodedUser.username,
                    email: decodedUser.email,
                    role: decodedUser.role,
                    is_staff: decodedUser.is_staff
                });

                localStorage.setItem('authTokens', JSON.stringify(data));
                return { success: true }; // Indicate success
            } else {
                console.error('Login failed:', data);
                return { success: false, error: data.detail || 'Something went wrong during login!' };
            }
        } catch (error) {
            console.error('Network error or unexpected issue during login:', error);
            return { success: false, error: 'Could not connect to the server or an unexpected error occurred.' };
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
    };

    const updateToken = async () => {
        // If no refresh token, or if tokens are null/undefined, stop trying to update
        if (!authTokens?.refresh) {
            setLoading(false); // Finished loading attempt
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}auth/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: authTokens.refresh }),
            });

            const data = await response.json();

            if (response.status === 200) {
                setAuthTokens(data);
                const decodedUser = jwtDecode(data.access);
                setUser({
                    user_id: decodedUser.user_id,
                    username: decodedUser.username,
                    email: decodedUser.email,
                    role: decodedUser.role,
                    is_staff: decodedUser.is_staff
                });
                localStorage.setItem('authTokens', JSON.stringify(data));
            } else {
                // If refresh token fails (e.g., expired or invalid), log user out
                console.warn('Failed to refresh token, logging out.');
                logoutUser();
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            logoutUser(); // Log out if network error occurs during refresh
        } finally {
            setLoading(false); // Set loading to false after token check/refresh, regardless of outcome
        }
    };

    useEffect(() => {
        if (loading) {
            updateToken(); // Attempt to update token on initial component mount
        }

        // Set up interval for token refresh (e.g., every 4 minutes)
        let fourMinutes = 1000 * 60 * 4;
        let interval = setInterval(() => {
            if (authTokens) { // Only try to refresh if tokens exist
                updateToken();
            }
        }, fourMinutes);

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [authTokens, loading]); // Dependencies for useEffect

    let contextData = {
        user: user,
        authTokens: authTokens,
        login: loginUser, // Renamed to 'login' to match your LoginPage component
        logout: logoutUser, // Renamed to 'logout'
        loading: loading
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? null : children} {/* Only render children once loading is false */}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    return useContext(AuthContext);
}
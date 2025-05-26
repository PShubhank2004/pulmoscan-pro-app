// src/utils/axiosInstance.js (or similar)
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // For decoding tokens
import dayjs from 'dayjs'; // For checking token expiry time

const baseURL = 'http://127.0.0.1:8000/api/';

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// This is the core logic for automatic token refresh and retry
axiosInstance.interceptors.request.use(async req => {
    // Get tokens from localStorage
    const authTokens = localStorage.getItem('authTokens')
        ? JSON.parse(localStorage.getItem('authTokens'))
        : null;

    if (authTokens) {
        req.headers.Authorization = `Bearer ${authTokens.access}`;

        // Decode the access token to check its expiry
        const user = jwtDecode(authTokens.access);
        const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1; // Check if less than 1 second to expiry

        // If the access token is NOT expired, just send the request
        if (!isExpired) return req;

        // If the access token IS expired, attempt to refresh it
        try {
            const response = await axios.post(`${baseURL}auth/token/refresh/`, {
                refresh: authTokens.refresh,
            });

            // If refresh is successful, update tokens in localStorage and state
            const newAuthTokens = response.data;
            localStorage.setItem('authTokens', JSON.stringify(newAuthTokens));

            // IMPORTANT: Update the Authorization header of the *current request* with the NEW access token
            req.headers.Authorization = `Bearer ${newAuthTokens.access}`;

            // You might also want to update the AuthContext state here if this interceptor is outside of it
            // but for simplicity, let's assume AuthContext will re-read from localStorage or a different mechanism.
            // If this interceptor is *inside* AuthContext, you'd use setAuthTokens and setUser here.

            return req; // Return the request with the new token
        } catch (error) {
            console.error("Axios Interceptor: Failed to refresh token during retry, logging out:", error.response?.data || error.message);
            // If refresh fails (e.g., refresh token expired), clear tokens and redirect to login
            localStorage.removeItem('authTokens');
            // This is where you'd typically trigger a logout in your AuthContext if possible,
            // or directly redirect if this interceptor is not directly in AuthContext.
            window.location.href = '/login'; // Force redirect to login
            return Promise.reject(error); // Reject the original request
        }
    }

    return req; // If no tokens, just send the request without auth header
});

export default axiosInstance;
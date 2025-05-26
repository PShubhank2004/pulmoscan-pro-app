import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import Material-UI components
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    CircularProgress // Added for loading state feedback
} from '@mui/material';
import { useTheme } from '@mui/material/styles'; // To access theme spacing

// Import your background image (assuming it's in public/images/bg-login.jpg or similar)
// Adjust the path based on where you place your image in the 'public' folder.
// For public folder images, you reference them directly from the root.
// Example: If your image is in public/images/background.jpg, the path is '/images/background.jpg'
const backgroundImage = 'PulmoScan_image.png'; // <<< ADJUST THIS PATH AS NEEDED


const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // New loading state
    const navigate = useNavigate();
    const { login } = useAuth();
    const theme = useTheme(); // Initialize useTheme

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true); // Start loading

        const result = await login(username, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
        setLoading(false); // End loading
    };

    return (
        // Container to center the login box horizontally
        <Container
            component="main"
            maxWidth={false} // Allow container to fill screen for background
            disableGutters // Remove default horizontal padding from Container
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                // --- BACKGROUND IMAGE STYLES ---
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover', // Cover the entire container
                backgroundPosition: 'center', // Center the image
                backgroundRepeat: 'no-repeat', // Don't repeat the image
                // Optional: Add a subtle overlay to help text readability, especially with white images
                // This creates a slightly darker or colored tint over the image.
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Adjust opacity (0.0 to 1.0) and color as needed
                    zIndex: 0, // Ensure overlay is behind the Paper component
                },
                position: 'relative', // Needed for absolute positioning of ::before pseudo-element
                // --- END BACKGROUND IMAGE STYLES ---
                
                // Original background color as a fallback or for tinting
                // If you use the overlay (::before), this bgcolor might not be as visible.
                // You can remove it if the overlay works well.
                // bgcolor: theme.palette.background.default,

                p: theme.spacing(2) // Add some padding around the container content
            }}
        >
            <Paper elevation={8} sx={{ // Paper component for the login box with shadow
                p: theme.spacing(4), // Padding inside the paper
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: theme.shape.borderRadius * 2, // More rounded corners
                width: '100%', // Ensure it takes full width of maxWidth="xs"
                maxWidth: '440px', // Explicitly set max-width for the Paper for consistency if Container is maxWidth={false}
                boxShadow: theme.shadows[5], // Deeper shadow for a prominent look
                zIndex: 1, // Ensure Paper is above the background overlay
                // Optional: Add a slight transparency to the Paper itself if you want the background to show through a bit
                // This can make the UI feel more integrated with the background.
                // backgroundColor: 'rgba(255, 255, 255, 0.85)', // Example: 85% opaque white
                // If your theme uses dark mode, adjust the color accordingly.
            }}>
                <Typography component="h1" variant="h5" sx={{ mb: theme.spacing(3), color: theme.palette.primary.main }}>
                    PulmoScanPro Login
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: theme.spacing(3), borderRadius: theme.shape.borderRadius }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        variant="outlined" // Standard Material-UI text field style
                        sx={{ mb: theme.spacing(2) }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        variant="outlined"
                        sx={{ mb: theme.spacing(3)} }
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ py: theme.spacing(1.5), borderRadius: theme.shape.borderRadius, mt: theme.spacing(1) }}
                        disabled={loading} // Disable button while loading
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage;
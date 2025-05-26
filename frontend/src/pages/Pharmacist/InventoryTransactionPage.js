












































































































// frontend/src/pages/Pharmacist/InventoryTransactionPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance'; // Make sure this path is correct!

// ... (rest of your Material-UI imports)
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Card,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Box,
  CircularProgress
} from '@mui/material';

function InventoryTransactionPage() {
    const { authTokens, logout } = useAuth(); // Get logout from context
    const [medicines, setMedicines] = useState([]);
    const [selectedMedicine, setSelectedMedicine] = useState('');
    const [transactionType, setTransactionType] = useState('sale');
    const [quantity, setQuantity] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchMedicines = async () => {
            setLoading(true);
            setError('');
            // If authTokens are missing, log out to ensure consistent state
            if (!authTokens?.access) {
                setError('Authentication token missing. Please log in.');
                setLoading(false);
                logout(); // Force logout to clear invalid state
                return;
            }
            try {
                // Use axiosInstance for the medicine fetch
                const response = await axiosInstance.get('/medicines/');
                setMedicines(response.data.results || response.data);
            } catch (err) {
                console.error('Failed to fetch medicines:', err.response?.data || err.message);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setError('🚫 You do not have permission to view medicines. Please log in with a Pharmacist or Admin account.');
                    logout(); // Force logout if token is invalid or unauthorized
                } else {
                    setError('Could not load medicines. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (authTokens) { // Only attempt fetch if authTokens are available
            fetchMedicines();
        } else {
            setLoading(false);
            setError('Please log in to manage inventory.');
            logout(); // If authTokens are unexpectedly null here, force logout
        }
    }, [authTokens, logout]); // Add logout to dependencies

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        if (!authTokens?.access) {
            setError('Authentication token missing. Please log in.');
            setLoading(false);
            logout();
            return;
        }

        if (!selectedMedicine || !quantity || parseInt(quantity, 10) <= 0) { // Ensure quantity is valid
            setError('Please select a medicine and enter a valid quantity (greater than 0).');
            setLoading(false);
            return;
        }

        try {
            const data = {
                medicine: selectedMedicine,
                transaction_type: transactionType,
                quantity: parseInt(quantity, 10),
            };
            // Use axiosInstance for the transaction POST
            await axiosInstance.post('/inventory-transactions/', data);
            setSuccessMessage('Transaction recorded successfully! Stock updated.');
            setSelectedMedicine('');
            setQuantity('');
            // OPTIONAL: Re-fetch medicines to update displayed quantities immediately
            // fetchMedicines();
        } catch (err) {
            console.error('Transaction failed:', err.response?.data || err.message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('🚫 You do not have permission to record transactions. Please log in with a Pharmacist or Admin account.');
                logout(); // Force logout if permission is denied
            } else if (err.response?.data?.quantity) {
                setError(`Transaction failed: ${err.response.data.quantity[0]}`);
            } else if (err.response?.data?.detail) { // Catch general detail errors
                setError(`Transaction failed: ${err.response.data.detail}`);
            }
            else {
                setError('Failed to record transaction. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of your JSX code, no changes needed for the return statement's structure)
    if (loading && medicines.length === 0 && !error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
                <Typography ml={2}>Loading medicines...</Typography>
            </Box>
        );
    }

    // Added a specific error display if medicines fail to load
    if (error && medicines.length === 0 && !loading) {
        return (
            <Container maxWidth="sm" sx={{ mt: 5 }}>
                <Card variant="outlined" sx={{ boxShadow: 3 }}>
                    <CardContent>
                        <Alert severity="error">
                            <Typography variant="h6">Error Loading Medicines:</Typography>
                            <Typography>{error}</Typography>
                        </Alert>
                        <Box mt={3} sx={{ textAlign: 'center' }}>
                            <Button variant="contained" onClick={() => logout()}>Re-Login</Button> {/* Offer re-login */}
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        );
    }


    return (
        <Container maxWidth="sm" sx={{ mt: 5 }}>
            <Card variant="outlined" sx={{ boxShadow: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Record Inventory Transaction
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="medicine-select-label">Medicine</InputLabel>
                            <Select
                                labelId="medicine-select-label"
                                id="medicineSelect"
                                value={selectedMedicine}
                                onChange={(e) => setSelectedMedicine(e.target.value)}
                                required
                                disabled={loading}
                            >
                                <MenuItem value=""><em>Select a medicine</em></MenuItem>
                                {medicines.map((med) => (
                                    <MenuItem key={med.id} value={med.id}>
                                        {med.name} (Current: {med.quantity})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl component="fieldset" margin="normal">
                            <Typography variant="subtitle1">Transaction Type</Typography>
                            <RadioGroup
                                row
                                value={transactionType}
                                onChange={(e) => setTransactionType(e.target.value)}
                            >
                                <FormControlLabel value="sale" control={<Radio />} label="Sale" />
                                <FormControlLabel value="purchase" control={<Radio />} label="Purchase" />
                            </RadioGroup>
                        </FormControl>

                        <TextField
                            type="number"
                            id="quantityInput"
                            label="Quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                            inputProps={{ min: 1 }}
                            disabled={loading}
                        />

                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>} {/* Display error here */}
                        {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            fullWidth
                            sx={{ mt: 3 }}
                        >
                            {loading ? 'Recording...' : 'Record Transaction'}
                        </Button>
                    </Box>

                    <Box mt={3}>
                        <Link to="/pharmacist/medicines" style={{ textDecoration: 'none', color: '#1976d2' }}>
                            View All Medicines
                        </Link>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}

export default InventoryTransactionPage;
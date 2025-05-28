import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // <--- IMPORT useAuth
import axiosInstance from '../../utils/axiosInstance';
import { // Assuming you might want to use MUI for consistency, but keeping original structure as much as possible
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
  Card,
  CardContent
} from '@mui/material';
// import '../MedicineFormPage.css'; // Original CSS import, retain if you have this file

function MedicineFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authTokens } = useAuth(); // <--- GET authTokens

  const [formData, setFormData] = useState({
    name: '',
    batch_number: '',
    expiry_date: '',
    quantity: '',
    price: '',
    supplier: '',
    reorder_point: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchMedicine = async () => {
      setLoading(true);
      setError('');

      if (!authTokens?.access) { // <--- AUTH CHECK
        setError('Authentication token missing. Please log in.');
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`medicines/${id}/`, {
          headers: {
            'Authorization': `Bearer ${authTokens.access}`, // <--- ADD AUTH HEADER
          },
        });
        const data = response.data;
        setFormData({
          ...data,
          expiry_date: data.expiry_date ? data.expiry_date.substring(0, 10) : '',
          quantity: String(data.quantity),
          price: String(data.price),
          reorder_point: String(data.reorder_point || '')
        });
      } catch (err) {
        console.error('Failed to fetch medicine:', err.response?.data || err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
            setError('🚫 You do not have permission to view this medicine. Please log in with a Pharmacist or Admin account.');
        } else {
            setError('Failed to load medicine details for editing. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        if (authTokens) { // Only fetch if editing AND tokens exist
            fetchMedicine();
        } else {
            setLoading(false); // Stop loading if no tokens
            setError('Please log in to edit medicine details.');
        }
    }
  }, [id, authTokens]); // <--- Dependency on id and authTokens

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!authTokens?.access) { // <--- AUTH CHECK for submission
        setError('Authentication token missing. Please log in.');
        setLoading(false);
        return;
    }

    try {
      if (id) {
        await axiosInstance.put(`medicines/${id}/`, formData, {
          headers: {
            'Authorization': `Bearer ${authTokens.access}`, // <--- ADD AUTH HEADER
          },
        });
        setSuccessMessage('Medicine updated successfully!');
      } else {
        await axiosInstance.post('medicines/', formData, {
          headers: {
            'Authorization': `Bearer ${authTokens.access}`, // <--- ADD AUTH HEADER
          },
        });
        setSuccessMessage('Medicine added successfully!');
      }
      // Optionally, you can navigate back after a short delay to show the success message
      setTimeout(() => {
        navigate('/pharmacist/medicines');
      }, 1500); // Navigate after 1.5 seconds
    } catch (err) {
      console.error('Failed to save medicine:', err.response ? err.response.data : err.message);
      let errorMessage = 'Failed to save medicine. Please check your input.';
      if (err.response && err.response.status === 401 || err.response?.status === 403) {
          errorMessage = '🚫 You do not have permission to add/edit medicines. Please log in with a Pharmacist or Admin account.';
      } else if (err.response && typeof err.response.data === 'object') {
        // Attempt to parse specific error messages from the backend
        errorMessage += ' Details: ';
        for (const key in err.response.data) {
          errorMessage += `${key}: ${err.response.data[key].join(', ')} `;
        }
      } else {
        errorMessage += ` Details: ${err.response.data}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Simplified loading state for non-MUI components
  if (loading && id && !error) { // Only show full-page loading if editing and initially fetching
    return (
        <div className="loading-message" style={{ textAlign: 'center', marginTop: '50px' }}>
            <CircularProgress />
            <p>Loading medicine details...</p>
        </div>
    );
  }

  // Using Box and TextField for better MUI integration, but can revert to div/input if preferred.
  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Card variant="outlined" sx={{ boxShadow: 3, p: 3 }}>
        <Typography variant="h5" align="center" gutterBottom>
          {id ? 'Edit Medicine Details' : 'Add New Medicine'}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          <TextField
            fullWidth
            margin="normal"
            label="Medicine Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Batch Number"
            name="batch_number"
            value={formData.batch_number}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Expiry Date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
            disabled={loading}
          />
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            inputProps={{ min: 0 }}
            disabled={loading}
          />
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Price ($)"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            inputProps={{ min: 0, step: "0.01" }}
            disabled={loading}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Supplier"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Reorder Point"
            name="reorder_point"
            value={formData.reorder_point}
            onChange={handleChange}
            inputProps={{ min: 0 }}
            disabled={loading}
          />

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}

          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ flexGrow: 1 }}
            >
              {loading ? 'Saving...' : id ? 'Update Medicine' : 'Add Medicine'}
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/pharmacist/medicines')}
              disabled={loading}
              sx={{ flexGrow: 1 }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Card>
    </Container>
  );
}

export default MedicineFormPage;
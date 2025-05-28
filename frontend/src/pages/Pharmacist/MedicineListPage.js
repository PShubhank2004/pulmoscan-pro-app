import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // <--- IMPORT useAuth
import axiosInstance from '../../utils/axiosInstance';
import { // Adding Material-UI imports for consistency, or remove if you prefer pure CSS
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel
} from '@mui/material';
// import '../MedicineListPage.css'; // Original CSS import, retain if you have this file

function MedicineListPage() {
  const { authTokens } = useAuth(); // <--- GET authTokens
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true); // Set to true initially
  const [error, setError] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  const fetchMedicines = async () => {
    setLoading(true);
    setError('');

    if (!authTokens?.access) { // <--- AUTH CHECK
      setError('Authentication token missing. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get('medicines/', {
        headers: {
          'Authorization': `Bearer ${authTokens.access}`, // <--- ADD AUTH HEADER
        },
      });
      setMedicines(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch medicines:', err.response?.data || err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
          setError('🚫 You do not have permission to view medicines. Please log in with a Pharmacist or Admin account.');
      } else {
          setError('Failed to load medicines. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authTokens) { // <--- Only fetch if authTokens exist
        fetchMedicines();
    } else {
        setLoading(false); // Stop loading if no tokens
        setError('Please log in to view medicine inventory.');
    }
  }, [authTokens]); // <--- Dependency on authTokens

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) {
      setLoading(true); // Set loading while deleting
      setError('');

      if (!authTokens?.access) { // <--- AUTH CHECK for delete
        setError('Authentication token missing. Please log in to delete.');
        setLoading(false);
        return;
      }

      try {
        await axiosInstance.delete(`http://127.0.0.1:8000/api/medicines/${id}/`, {
          headers: {
            'Authorization': `Bearer ${authTokens.access}`, // <--- ADD AUTH HEADER
          },
        });
        await fetchMedicines(); // Refresh the list after successful deletion
      } catch (err) {
        console.error('Failed to delete medicine:', err.response?.data || err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
            setError('🚫 You do not have permission to delete medicines. Please log in with a Pharmacist or Admin account.');
        } else {
            setError('Failed to delete medicine. Please try again.');
        }
      } finally {
        setLoading(false); // Stop loading regardless of success/failure
      }
    }
  };

  const filteredMedicines = filterLowStock
    ? medicines.filter(med => med.quantity <= med.reorder_point)
    : medicines;

  if (loading && medicines.length === 0 && !error) { // Initial loading state
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography ml={2}>Loading medicines...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom align="center">
        Medicine Inventory Management
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/pharmacist/medicines/new"
        >
          + Add New Medicine
        </Button>
        
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {filteredMedicines.length === 0 && !loading ? (
        <Alert severity="info" sx={{ mt: 4 }}>
          {filterLowStock ? 'No low stock medicines found at the moment.' : 'No medicines found in your inventory.'}
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 650 }} aria-label="medicine inventory table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Name</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMedicines.map((medicine) => (
                <TableRow
                  key={medicine.id}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&.low-stock': { backgroundColor: '#ffebee' } // Light red for low stock
                  }}
                  className={medicine.quantity <= medicine.reorder_point ? 'low-stock' : ''}
                >
                  <TableCell component="th" scope="row">
                    {medicine.name}
                  </TableCell>
                  <TableCell>{medicine.batch_number}</TableCell>
                  <TableCell>{medicine.expiry_date}</TableCell>
                  <TableCell>
                    {medicine.quantity}
                    {medicine.quantity <= medicine.reorder_point && (
                      <Typography component="span" variant="caption" color="error" sx={{ ml: 1, fontWeight: 'bold' }}>
                        (LOW!)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>${parseFloat(medicine.price).toFixed(2)}</TableCell>
                  <TableCell>{medicine.supplier}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      to={`/pharmacist/medicines/edit/${medicine.id}`}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDelete(medicine.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default MedicineListPage;
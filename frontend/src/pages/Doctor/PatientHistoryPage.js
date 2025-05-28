import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // <--- IMPORT useAuth
import axiosInstance from '../../utils/axiosInstance'; // Adjust path as needed 
import { // Retaining basic MUI imports for consistency in styling, remove if not needed at all
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  // Removed ListItemSecondaryAction, IconButton
} from '@mui/material';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function PatientHistoryPage() {
  const { authTokens } = useAuth(); // <--- GET authTokens
  const [patientNameSearch, setPatientNameSearch] = useState('');
  const [scanReports, setScanReports] = useState([]);
  const [loading, setLoading] = useState(true); // Changed to true initially as it fetches on mount
  const [error, setError] = useState('');

  const fetchScanReports = async (name = '') => {
    setLoading(true);
    setError('');

    if (!authTokens?.access) { // <--- ADD AUTHENTICATION CHECK
        setError('Authentication token missing. Please log in.');
        setLoading(false);
        return;
    }

    try {
      const response = await axiosInstance.get(`scan-reports/?patient_name=${name}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.access}`, // <--- ADD Authorization HEADER
        },
      });
      // Handle Django REST Framework's default pagination structure if it exists
      setScanReports(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch scan reports:', err.response?.data || err.message); // Log full error
      if (err.response?.status === 401 || err.response?.status === 403) {
          setError('🚫 You do not have permission to view patient history. Please ensure you are logged in as a Doctor or Admin.');
      } else {
          setError('⚠️ Failed to load patient history. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if authTokens are available (i.e., user is logged in)
    if (authTokens) {
        fetchScanReports();
    } else {
        setLoading(false); // If no tokens, stop loading and potentially show an error
        setError('Please log in to view patient history.');
    }
  }, [authTokens]); // <--- ADD authTokens to dependency array

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchScanReports(patientNameSearch);
  };

  return (
    <Box sx={{ padding: '30px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <Typography variant="h4" sx={{ marginBottom: '20px', textAlign: 'center', color: '#333' }}>
        🧾 Patient Scan History
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4, display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <TextField
          fullWidth
          label="Search by Patient Name"
          variant="outlined"
          value={patientNameSearch}
          onChange={(e) => setPatientNameSearch(e.target.value)}
          sx={{ maxWidth: '300px' }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearchSubmit}
          sx={{ py: 1.5, px: 3 }}
        >
          🔍 Search
        </Button>
      </Paper>

      {loading && (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
          <Typography variant="body1" mt={2}>Loading reports...</Typography>
        </Box>
      )}
      {error && (
        <Box textAlign="center" mt={4}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      {!loading && scanReports.length === 0 && !error && (
        <Box textAlign="center" mt={4}>
          <Typography variant="body1" fontStyle="italic">No scan reports found.</Typography>
        </Box>
      )}

      {!loading && scanReports.length > 0 && (
        <List component={Paper} elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          {scanReports.map((report) => (
            <ListItem
              key={report.id}
              divider
              sx={{
                py: 2,
                px: 3,
                transition: 'background-color 0.2s',
                '&:hover': { backgroundColor: '#f5f5f5' },
                display: 'flex', // Use flexbox for layout
                justifyContent: 'space-between', // Space between text and button
                alignItems: 'center', // Vertically align items
              }}
            >
              <ListItemText
                primary={<Typography variant="h6">👤 Patient: {report.patient_name}</Typography>}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      <strong>Diagnosis:</strong>{' '}
                      <span style={{ color: report.diagnosis === 'Pneumonia' ? 'red' : 'green', fontWeight: 'bold' }}>
                        {report.diagnosis}
                      </span>
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="text.secondary">
                      <strong>Confidence:</strong> {report.confidence}%
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="text.secondary">
                      <strong>Uploaded:</strong> {new Date(report.date_uploaded).toLocaleString()}
                    </Typography>
                  </React.Fragment>
                }
              />
              {/* Replaced IconButton with a standard MUI Button */}
              <Button
                variant="outlined"
                size="small"
                component={Link}
                to={`/doctor/scan-reports/${report.id}`}
                sx={{ ml: 2, flexShrink: 0 }} // Add margin-left and prevent shrinking
              >
                View Details
              </Button>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default PatientHistoryPage;
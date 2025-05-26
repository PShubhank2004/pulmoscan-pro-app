import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import axiosInstance from '../../utils/axiosInstance';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Input,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';

function ScanUploadPage() {
  const { authTokens } = useAuth(); // Get authTokens
  const [patientName, setPatientName] = useState('');
  const [scanImage, setScanImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setScanImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setResult(null);
    setError('');

    if (!authTokens?.access) { // Check for token
        setError('Authentication token missing. Please log in.');
        setUploading(false);
        return;
    }

    if (!scanImage || !patientName) {
      setError('Please provide patient name and select an image.');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('patient_name', patientName);
    formData.append('scan_image', scanImage);

    try {
      const response = await axiosInstance.post('http://127.0.0.1:8000/api/scan-reports/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${authTokens.access}`, // Add Authorization header
        },
      });
      setResult(response.data);
      setPatientName('');
      setScanImage(null);
      document.getElementById('scanImageInput').value = '';
    } catch (err) {
      console.error('Scan upload failed:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Authentication failed or you do not have permission to upload scans. Please log in with a Doctor or Admin account.');
      } else {
          setError('Failed to upload scan or get diagnosis. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Upload Medical Scan
      </Typography>

      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Box mb={3}>
            <TextField
              fullWidth
              label="Patient Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
            />
          </Box>

          <Box mb={3}>
            <Input
              fullWidth
              type="file"
              id="scanImageInput"
              inputProps={{ accept: 'image/*' }}
              onChange={handleFileChange}
              required
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={uploading}
            startIcon={uploading && <CircularProgress size={20} />}
          >
            {uploading ? 'Analyzing...' : 'Upload & Analyze'}
          </Button>
        </form>
      </Paper>

      {result && (
        <Card sx={{ mt: 4, backgroundColor: '#f5faff' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              AI Analysis Result
            </Typography>
            <Typography>
              <strong>Patient Name:</strong> {result.patient_name}
            </Typography>
            <Typography>
              <strong>Diagnosis:</strong>{' '}
              <span style={{ color: result.diagnosis === 'Pneumonia' ? 'red' : 'green', fontWeight: 'bold' }}>
                {result.diagnosis}
              </span>
            </Typography>
            <Typography>
              <strong>Confidence:</strong> {result.confidence}%
            </Typography>

            {result.scan_image && (
              <CardMedia
                component="img"
                image={result.scan_image}
                alt="Uploaded Scan"
                sx={{ mt: 2, maxHeight: 300, objectFit: 'contain', border: '1px solid #ddd' }}
              />
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Report ID: {result.id} | Uploaded On:{' '}
              {new Date(result.date_uploaded).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default ScanUploadPage;
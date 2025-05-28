import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../../utils/axiosInstance';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  Grid,
  Divider
} from '@mui/material';

function ScanReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axiosInstance.get(`scan-reports/${id}/`);
        setReport(response.data);
      } catch (err) {
        console.error('Failed to fetch scan report:', err);
        setError('⚠️ Failed to load scan report details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <Box mt={10} textAlign="center">
        <CircularProgress />
        <Typography variant="body1" mt={2}>Loading report details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={10} textAlign="center">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!report) {
    return (
      <Box mt={10} textAlign="center">
        <Typography variant="h6">Report not found.</Typography>
      </Box>
    );
  }

  return (
    <Box maxWidth="md" mx="auto" mt={6} px={2}>
      <Typography variant="h4" textAlign="center" gutterBottom>
         Scan Report {report.id}
      </Typography>

      <Card variant="outlined" sx={{ boxShadow: 3, p: 2 }}>
        <Grid container spacing={3}>
          {/* LEFT COLUMN - DETAILS */}
          <Grid item xs={12} md={6}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Patient Details</Typography>
              <Divider sx={{ mb: 2 }} />

              <Typography><strong>Name:</strong> {report.patient_name}</Typography>

              <Typography mt={2}>
                <strong>Diagnosis:</strong>{' '}
                <span style={{
                  color: report.diagnosis === 'Pneumonia' ? '#d32f2f' : '#2e7d32',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {report.diagnosis}
                </span>
              </Typography>

              <Typography mt={2}><strong>Confidence:</strong> {report.confidence}%</Typography>
              <Typography mt={2}><strong>Date Uploaded:</strong> {new Date(report.date_uploaded).toLocaleString()}</Typography>
            </CardContent>
          </Grid>

          {/* RIGHT COLUMN - IMAGE */}
          <Grid item xs={12} md={6}>
            {report.scan_image ? (
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom>Scan Image</Typography>
                <img
                  src={report.scan_image}
                  alt="Patient Scan"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  }}
                />
              </Box>
            ) : (
              <Typography>No image available</Typography>
            )}
          </Grid>
        </Grid>
      </Card>

      {/* BACK BUTTON */}
      <Box mt={4} textAlign="center">
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/doctor/patients"
        >
          ← Back to Patient History
        </Button>
      </Box>
    </Box>
  );
}

export default ScanReportDetail;

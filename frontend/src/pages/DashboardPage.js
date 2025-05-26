// frontend/src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import {
  Grid, Paper, Typography, Box, CircularProgress, Alert, Link, List, ListItem, ListItemText, Divider,
} from '@mui/material';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import DebugUser from '../components/DebugUser';
import './DashboardPage.css';
import axiosInstance from '../utils/axiosInstance';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function DashboardPage() {
  const { user, authTokens } = useAuth();
  const [stockSummary, setStockSummary] = useState(null);
  const [doctorSummary, setDoctorSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      if (!user || !authTokens?.access) {
        setError('Authentication required to view dashboard data.');
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${authTokens.access}`,
      };

      try {
        if (user.role === 'admin' || user.role === 'pharmacist') {
          const stockResponse = await axiosInstance.get('http://127.0.0.1:8000/api/dashboard/stock-summary/', { headers });
          setStockSummary(stockResponse.data);
        } else {
          setStockSummary(null);
        }

        if (user.role === 'admin' || user.role === 'doctor') {
          const doctorResponse = await axiosInstance.get('http://127.0.0.1:8000/api/dashboard/doctor-summary/', { headers });
          setDoctorSummary(doctorResponse.data);
        } else {
          setDoctorSummary(null);
        }
      } catch (err) {
        console.error('Dashboard data fetch failed:', err.response?.data || err.message);
        setError('Failed to load dashboard data. Check API server and permissions.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authTokens]);

  const stockChartData = stockSummary ? [
    { name: 'Low Stock', value: stockSummary.low_stock_count },
    { name: 'Expired', value: stockSummary.expired_count },
    { name: 'Expiring Soon', value: stockSummary.expiring_soon_count },
    {
      name: 'Sufficient Stock',
      value: stockSummary.total_medicines - stockSummary.low_stock_count - stockSummary.expired_count - stockSummary.expiring_soon_count,
    },
  ] : [];

  const doctorChartData = doctorSummary ? [
    { name: 'Pneumonia Cases', value: doctorSummary.pneumonia_cases },
    { name: 'Normal Cases', value: doctorSummary.normal_cases },
  ] : [];

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!user) return <Alert severity="info">Please log in to view the dashboard.</Alert>;

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">PulmoScanPro Dashboard</Typography>

      {/* Stock Section */}
      {(user.role === 'admin' || user.role === 'pharmacist') && stockSummary && (
        <Paper elevation={4} sx={{ p: 3, mb: 5, borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>📦 Medicine Stock Overview</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Total Medicines: <b>{stockSummary?.total_medicines || 'N/A'}</b></Typography>
              <Typography color="error">Low Stock: <b>{stockSummary?.low_stock_count || 0}</b></Typography>
              <Typography sx={{ color: 'darkred' }}>Expired: <b>{stockSummary?.expired_count || 0}</b></Typography>
              <Typography sx={{ color: 'orange' }}>Expiring Soon: <b>{stockSummary?.expiring_soon_count || 0}</b></Typography>

              {stockSummary?.low_stock_medicines?.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2">Low Stock Medicines:</Typography>
                  <List dense>
                    {stockSummary.low_stock_medicines.map(med => (
                      <ListItem key={med.id}>
                        <ListItemText primary={`${med.name}: ${med.quantity} units`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {stockSummary?.expiring_soon_medicines?.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2">Expiring Soon:</Typography>
                  <List dense>
                    {stockSummary.expiring_soon_medicines.map(med => (
                      <ListItem key={med.id}>
                        <ListItemText primary={`${med.name}: Expires ${med.expiry_date} (${med.quantity} units)`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Box mt={2}>
                <Link component={RouterLink} to="/pharmacist/medicines" underline="hover">Manage Medicines →</Link>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" align="center">Stock Distribution</Typography>
              <PieChart width={400} height={300}>
                <Pie data={stockChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {stockChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Doctor Section */}
      {(user.role === 'admin' || user.role === 'doctor') && doctorSummary && (
        <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>🩺 Scan Analysis Summary</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Total Scans: <b>{doctorSummary?.total_scans || 0}</b></Typography>
              <Typography color="error">Pneumonia Cases: <b>{doctorSummary?.pneumonia_cases || 0}</b></Typography>
              <Typography sx={{ color: 'green' }}>Normal Cases: <b>{doctorSummary?.normal_cases || 0}</b></Typography>

              {doctorSummary?.recent_scans?.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2">Recent Scans:</Typography>
                  <List dense>
                    {doctorSummary.recent_scans.map(scan => (
                      <ListItem key={scan.id}>
                        <ListItemText
                          primary={`Patient: ${scan.patient_name}, Diagnosis: ${scan.diagnosis} (Confidence: ${scan.confidence}%)`}
                          secondary={
                            <Link component={RouterLink} to={`/doctor/scan-reports/${scan.id}`} underline="hover">
                              View →
                            </Link>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Box mt={2}>
                <Link component={RouterLink} to="/doctor/patients" sx={{ mr: 2 }} underline="hover">Patient Scan History</Link>
                <Link component={RouterLink} to="/doctor/scan-upload" underline="hover">Upload New Scan</Link>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" align="center">Diagnosis Distribution</Typography>
              <PieChart width={400} height={300}>
                <Pie data={doctorChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {doctorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Role Info Messages */}
      {(user.role !== 'admin' && user.role !== 'pharmacist') && !loading && !error && !stockSummary &&
        <Alert severity="info" sx={{ mt: 3 }}>You do not have permission to view stock overview.</Alert>}

      {(user.role !== 'admin' && user.role !== 'doctor') && !loading && !error && !doctorSummary &&
        <Alert severity="info" sx={{ mt: 3 }}>You do not have permission to view scan analysis summary.</Alert>}
    </Box>
  );
}

export default DashboardPage;

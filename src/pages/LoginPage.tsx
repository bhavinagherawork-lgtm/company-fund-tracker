import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Chip,
  CircularProgress,
  Grid2 as Grid,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TableChartIcon from '@mui/icons-material/TableChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activePreset, setActivePreset] = useState<'admin' | 'manager' | 'accountant'>('admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await login(username, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (u: string, p: string, preset: 'admin' | 'manager' | 'accountant') => {
    setUsername(u);
    setPassword(p);
    setActivePreset(preset);
    setErrorMessage(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        bgcolor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1.5, sm: 2.5, md: 3 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(248, 250, 252, 0) 70%)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22, 163, 74, 0.06) 0%, rgba(248, 250, 252, 0) 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 960,
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 32px -8px rgba(15, 23, 42, 0.08)',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          zIndex: 1,
        }}
      >
        {/* Left Side: Brand Value Proposition & Trust Hero (Mirror Test) */}
        <Box
          sx={{
            flex: { xs: '1 1 auto', md: '1 1 45%' },
            bgcolor: '#f8fafc',
            borderRight: { md: '1px solid #e2e8f0' },
            borderBottom: { xs: '1px solid #e2e8f0', md: 'none' },
            p: { xs: 2.5, sm: 3, md: 3.5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Top Brand Banner */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  bgcolor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                <AccountBalanceWalletIcon sx={{ color: '#ffffff', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                    fontSize: '1.15rem',
                    fontFamily: '"Space Grotesk", sans-serif',
                    lineHeight: 1.1,
                  }}
                >
                  ExpenseFlow
                </Typography>
                <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Enterprise Finance & Cash Ledger
                </Typography>
              </Box>
            </Box>

            {/* Audience Badge (The Mirror Test: Who is this for?) */}
            <Chip
              icon={<CorporateFareIcon sx={{ fontSize: '12px !important', color: '#2563eb !important' }} />}
              label="For Business Owners, Branch Managers & Finance Teams"
              size="small"
              sx={{
                bgcolor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontSize: '0.68rem',
                fontWeight: 600,
                height: 22,
                mb: 2,
                borderRadius: '9999px',
                '& .MuiChip-icon': { ml: 0.8 },
              }}
            />

            {/* Outcome Promise Headline (The Mirror Test: What do I get?) */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#0f172a',
                fontSize: { xs: '1.2rem', sm: '1.35rem' },
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
                fontFamily: '"Space Grotesk", sans-serif',
                mb: 1.2,
              }}
            >
              Real-time petty cash tracking with zero unaccounted leaks.
            </Typography>

            <Typography variant="body2" sx={{ color: '#4d4d4d', fontSize: '0.78rem', lineHeight: 1.5, mb: 2.5 }}>
              Audited daily expenditure tracking, multi-branch fund allocations, and 1-click two-sheet Excel reports.
            </Typography>

            {/* Feature Highlights Grid */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <TrendingUpIcon sx={{ color: '#16a34a', fontSize: 18, mt: 0.15, flexShrink: 0 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>
                    Active Ledger & Cash Runway
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.7rem' }}>
                    Monitor opening balances, daily safe burn rates, and net cash positions live.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <TableChartIcon sx={{ color: '#2563eb', fontSize: 18, mt: 0.15, flexShrink: 0 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>
                    Multi-Sheet Excel Statements
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.7rem' }}>
                    Automated Sheet 1 (OverAll Summary) & Sheet 2 (Itemized Details) standard.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <SecurityIcon sx={{ color: '#f59e0b', fontSize: 18, mt: 0.15, flexShrink: 0 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>
                    Mandatory Policy & Access Control
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.7rem' }}>
                    Role-based security for Admins, Managers, and Accountants with tamper-proof records.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Bottom Security Assurance */}
          <Box sx={{ mt: 3, pt: 1.5, borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <CheckCircleOutlineIcon sx={{ color: '#16a34a', fontSize: 15 }} />
              <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.7rem', fontWeight: 600 }}>
                100% Client-Side Encryption
              </Typography>
            </Box>
            <Chip
              label="Live Sync Ready"
              size="small"
              sx={{ bgcolor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.62rem', fontWeight: 700, height: 18 }}
            />
          </Box>
        </Box>

        {/* Right Side: Compact, Ergonomic Sign-In Form (The Mirror Test: What do I do next?) */}
        <Box
          sx={{
            flex: { xs: '1 1 auto', md: '1 1 55%' },
            p: { xs: 2.5, sm: 3, md: 3.5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: '#ffffff',
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#0f172a',
                fontSize: '1.25rem',
                fontFamily: '"Space Grotesk", sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              Sign In to Workspace
            </Typography>
            <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.74rem' }}>
              Enter your authorized staff credentials to open your financial ledger
            </Typography>
          </Box>

          {/* Error Banner */}
          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 1.8,
                borderRadius: '8px',
                fontSize: '0.75rem',
                py: 0.3,
                px: 1.2,
              }}
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.74rem', mb: 0.4, display: 'block' }}>
                Username or Work Email <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                placeholder="e.g. admin or staff@company.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                autoComplete="username"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ color: '#71717a', fontSize: 17 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiInputBase-root': { height: 36, borderRadius: '8px', bgcolor: '#ffffff' },
                  '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.8 },
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.74rem' }}>
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
              </Box>
              <TextField
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                size="small"
                fullWidth
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete="current-password"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#71717a', fontSize: 17 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#71717a', p: 0.5 }}
                        >
                          {showPassword ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiInputBase-root': { height: 36, borderRadius: '8px', bgcolor: '#ffffff' },
                  '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.8 },
                }}
              />
            </Box>

            {/* Primary Action Button (10% High-Contrast Accent) */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={15} color="inherit" /> : <LoginIcon sx={{ fontSize: 16 }} />}
              sx={{
                mt: 0.5,
                height: 36,
                bgcolor: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                  boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)',
                },
              }}
            >
              {submitting ? 'Authenticating...' : 'Sign In to Workspace'}
            </Button>
          </Box>

          {/* Quick Access Credentials Segmented Cards */}
          <Box sx={{ mt: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Quick Test Credentials (1-Tap Fill)
              </Typography>
              <KeyIcon sx={{ fontSize: 14, color: '#71717a' }} />
            </Box>

            <Grid container spacing={1}>
              <Grid size={{ xs: 4 }}>
                <Box
                  onClick={() => handleQuickFill('admin', 'admin123', 'admin')}
                  sx={{
                    p: '8px 10px',
                    borderRadius: '8px',
                    bgcolor: activePreset === 'admin' ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${activePreset === 'admin' ? '#2563eb' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    textAlign: 'center',
                    '&:hover': {
                      borderColor: '#2563eb',
                      bgcolor: '#eff6ff',
                    },
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: activePreset === 'admin' ? '#1d4ed8' : '#0f172a', display: 'block', fontSize: '0.72rem' }}>
                    Admin
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.64rem', display: 'block' }}>
                    Full Access
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 4 }}>
                <Box
                  onClick={() => handleQuickFill('manager', 'manager123', 'manager')}
                  sx={{
                    p: '8px 10px',
                    borderRadius: '8px',
                    bgcolor: activePreset === 'manager' ? '#fefce8' : '#f8fafc',
                    border: `1px solid ${activePreset === 'manager' ? '#eab308' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    textAlign: 'center',
                    '&:hover': {
                      borderColor: '#eab308',
                      bgcolor: '#fefce8',
                    },
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: activePreset === 'manager' ? '#a16207' : '#0f172a', display: 'block', fontSize: '0.72rem' }}>
                    Manager
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.64rem', display: 'block' }}>
                    Branch Ops
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 4 }}>
                <Box
                  onClick={() => handleQuickFill('accountant', 'account123', 'accountant')}
                  sx={{
                    p: '8px 10px',
                    borderRadius: '8px',
                    bgcolor: activePreset === 'accountant' ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${activePreset === 'accountant' ? '#22c55e' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    textAlign: 'center',
                    '&:hover': {
                      borderColor: '#22c55e',
                      bgcolor: '#f0fdf4',
                    },
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: activePreset === 'accountant' ? '#15803d' : '#0f172a', display: 'block', fontSize: '0.72rem' }}>
                    Accountant
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.64rem', display: 'block' }}>
                    Ledger Staff
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Footer Note */}
          <Box sx={{ mt: 2.5, pt: 1.5, borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.68rem' }}>
              Protected by Argon2id password hashing
            </Typography>
            <Chip
              label="v1.0 Standard"
              size="small"
              sx={{ bgcolor: '#f4f4f5', color: '#71717a', fontSize: '0.62rem', fontWeight: 600, height: 18 }}
            />
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

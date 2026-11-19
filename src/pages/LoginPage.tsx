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
  Divider,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 30px rgba(0, 82, 255, 0.06)',
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Brand Accent Top Stripe */}
        <Box sx={{ height: 4, bgcolor: '#0052ff' }} />

        <CardContent sx={{ p: '28px 24px !important' }}>
          {/* Logo & System Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: '#0052ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.2,
                boxShadow: '0 4px 12px rgba(0, 82, 255, 0.25)',
              }}
            >
              <AccountBalanceWalletIcon sx={{ color: '#ffffff', fontSize: 24 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#0a0b0d',
                letterSpacing: '-0.3px',
                fontSize: '1.25rem',
              }}
            >
              ExpenseFlow
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
              Operations & Audited Funds Manager
            </Typography>
          </Box>

          <Box sx={{ mb: 2.2, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
              Sign In to Your Workspace
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.73rem' }}>
              Enter your credentials to access company finances
            </Typography>
          </Box>

          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: '6px',
                fontSize: '0.75rem',
                py: 0.2,
              }}
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
            <TextField
              label="Username or Email"
              variant="outlined"
              size="small"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              autoComplete="username"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: '#0052ff', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiInputBase-input': { fontSize: '0.82rem', py: 1.1 },
                '& .MuiInputLabel-root': { fontSize: '0.82rem' },
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              size="small"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoComplete="current-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#0052ff', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#64748b' }}
                      >
                        {showPassword ? <VisibilityOffIcon sx={{ fontSize: 17 }} /> : <VisibilityIcon sx={{ fontSize: 17 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiInputBase-input': { fontSize: '0.82rem', py: 1.1 },
                '& .MuiInputLabel-root': { fontSize: '0.82rem' },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <LoginIcon sx={{ fontSize: 17 }} />}
              sx={{
                mt: 0.5,
                height: 38,
                bgcolor: '#0052ff',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                borderRadius: '6px',
                textTransform: 'none',
                boxShadow: '0 2px 6px rgba(0, 82, 255, 0.25)',
                '&:hover': {
                  bgcolor: '#0042cc',
                },
              }}
            >
              {submitting ? 'Verifying Credentials...' : 'Sign In to Workspace'}
            </Button>
          </Box>

          <Divider sx={{ my: 2.2, borderColor: '#f1f5f9' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
              QUICK ACCESS CREDENTIALS
            </Typography>
          </Divider>

          {/* Quick Demo Fill Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            <Box
              onClick={() => handleQuickFill('admin', 'admin123')}
              sx={{
                p: '8px 12px',
                borderRadius: '6px',
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: '#0052ff',
                  bgcolor: '#eff6ff',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <KeyIcon sx={{ fontSize: 16, color: '#0052ff' }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', display: 'block', fontSize: '0.72rem' }}>
                    admin / admin123
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                    Default Administrator
                  </Typography>
                </Box>
              </Box>
              <Chip label="Admin" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: '0.62rem', height: 18 }} />
            </Box>

            <Box
              onClick={() => handleQuickFill('accountant', 'account123')}
              sx={{
                p: '8px 12px',
                borderRadius: '6px',
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: '#05b169',
                  bgcolor: '#f0fdf4',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <KeyIcon sx={{ fontSize: 16, color: '#05b169' }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', display: 'block', fontSize: '0.72rem' }}>
                    accountant / account123
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                    Finance Staff
                  </Typography>
                </Box>
              </Box>
              <Chip label="Accountant" size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.62rem', height: 18 }} />
            </Box>
          </Box>

          {/* Mandatory User Requirement Notice */}
          <Box
            sx={{
              mt: 2.2,
              p: '8px 10px',
              borderRadius: '6px',
              bgcolor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
            }}
          >
            <SecurityIcon sx={{ fontSize: 16, color: '#05b169', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: '#166534', fontSize: '0.68rem', fontWeight: 600 }}>
              System Enforced: At least 1 mandatory user entry is active in the User Table.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="caption" sx={{ mt: 2, color: '#94a3b8', fontSize: '0.7rem' }}>
        ExpenseFlow Secure Offline Architecture • IndexedDB Enforced
      </Typography>
    </Box>
  );
};

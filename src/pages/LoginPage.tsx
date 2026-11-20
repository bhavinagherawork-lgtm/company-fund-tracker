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
        bgcolor: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        backgroundImage: 'radial-gradient(#e4e4e7 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: '16px', // --radius-soft-card
          border: '1px solid #e4e4e7',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Brand Accent Top Stripe */}
        <Box sx={{ height: 4, bgcolor: '#18181b' }} />

        <CardContent sx={{ p: '32px 28px !important' }}>
          {/* Logo & System Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                bgcolor: '#18181b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
                boxShadow: '0 4px 14px rgba(24, 24, 27, 0.25)',
                border: '1px solid #27272a',
              }}
            >
              <AccountBalanceWalletIcon sx={{ color: '#eab308', fontSize: 24 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#09090b',
                fontFamily: '"Space Grotesk", sans-serif',
                letterSpacing: '-0.02em',
                fontSize: '1.35rem',
              }}
            >
              ExpenseFlow
            </Typography>
            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Operations & Audited Funds Manager
            </Typography>
          </Box>

          <Box sx={{ mb: 2.5, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#09090b', fontSize: '0.98rem', fontFamily: '"Space Grotesk", sans-serif' }}>
              Sign In to Your Workspace
            </Typography>
            <Typography variant="body2" sx={{ color: '#71717a', fontSize: '0.78rem' }}>
              Enter your credentials to access company finances
            </Typography>
          </Box>

          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: '12px',
                fontSize: '0.78rem',
                py: 0.4,
              }}
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                      <PersonOutlineIcon sx={{ color: '#71717a', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiInputBase-input': { fontSize: '0.84rem', py: 1.1 },
                '& .MuiInputLabel-root': { fontSize: '0.84rem' },
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
                      <LockOutlinedIcon sx={{ color: '#71717a', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#71717a' }}
                      >
                        {showPassword ? <VisibilityOffIcon sx={{ fontSize: 17 }} /> : <VisibilityIcon sx={{ fontSize: 17 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiInputBase-input': { fontSize: '0.84rem', py: 1.1 },
                '& .MuiInputLabel-root': { fontSize: '0.84rem' },
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
                height: 42,
                bgcolor: '#18181b',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.84rem',
                borderRadius: '9999px',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(24, 24, 27, 0.2)',
                '&:hover': {
                  bgcolor: '#27272a',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {submitting ? 'Verifying Credentials...' : 'Sign In to Workspace'}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: '#e4e4e7' }}>
            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em' }}>
              QUICK ACCESS CREDENTIALS
            </Typography>
          </Divider>

          {/* Quick Demo Fill Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              onClick={() => handleQuickFill('admin', 'admin123')}
              sx={{
                p: '10px 14px',
                borderRadius: '9999px',
                bgcolor: '#ffffff',
                border: '1px solid #e4e4e7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  borderColor: '#18181b',
                  bgcolor: '#fafafa',
                  transform: 'translateX(2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <KeyIcon sx={{ fontSize: 16, color: '#eab308' }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#09090b', display: 'block', fontSize: '0.76rem' }}>
                    admin / admin123
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.68rem' }}>
                    Default Administrator
                  </Typography>
                </Box>
              </Box>
              <Chip label="Admin" size="small" sx={{ bgcolor: '#18181b', color: '#eab308', fontWeight: 700, fontSize: '0.65rem', height: 20, borderRadius: '9999px' }} />
            </Box>

            <Box
              onClick={() => handleQuickFill('accountant', 'account123')}
              sx={{
                p: '10px 14px',
                borderRadius: '9999px',
                bgcolor: '#ffffff',
                border: '1px solid #e4e4e7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  borderColor: '#18181b',
                  bgcolor: '#fafafa',
                  transform: 'translateX(2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <KeyIcon sx={{ fontSize: 16, color: '#22c55e' }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#09090b', display: 'block', fontSize: '0.76rem' }}>
                    accountant / account123
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.68rem' }}>
                    Finance Staff
                  </Typography>
                </Box>
              </Box>
              <Chip label="Accountant" size="small" sx={{ bgcolor: '#f4f4f5', color: '#09090b', fontWeight: 600, fontSize: '0.65rem', height: 20, borderRadius: '9999px', border: '1px solid #e4e4e7' }} />
            </Box>
          </Box>

          {/* Mandatory User Requirement Notice */}
          <Box
            sx={{
              mt: 2.5,
              p: '10px 14px',
              borderRadius: '12px',
              bgcolor: '#fafafa',
              border: '1px solid #e4e4e7',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SecurityIcon sx={{ fontSize: 18, color: '#22c55e', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: '#09090b', fontSize: '0.72rem', fontWeight: 500 }}>
              System Enforced: At least 1 mandatory user entry is active in the User Table.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="caption" sx={{ mt: 2.5, color: '#71717a', fontSize: '0.74rem' }}>
        ExpenseFlow Secure Architecture • Reui Visual Standard
      </Typography>
    </Box>
  );
};

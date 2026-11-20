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
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'accountant'>('admin');

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
        setErrorMessage(res.error || 'Invalid username or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (u: string, p: string, role: 'admin' | 'manager' | 'accountant') => {
    setUsername(u);
    setPassword(p);
    setSelectedRole(role);
    setErrorMessage(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        bgcolor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 380,
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: '28px 24px !important' }}>
          {/* Minimal Brand Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.2,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              <AccountBalanceWalletIcon sx={{ color: '#ffffff', fontSize: 22 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                fontSize: '1.25rem',
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              ExpenseFlow
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#64748b', fontSize: '0.76rem', mt: 0.3 }}
            >
              Sign in to your financial workspace
            </Typography>
          </Box>

          {/* Error Message */}
          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: '8px',
                fontSize: '0.75rem',
                py: 0.4,
                px: 1.2,
              }}
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Form */}
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}
          >
            {/* Username Field */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '0.74rem',
                  mb: 0.4,
                  display: 'block',
                }}
              >
                Username or Email <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                autoComplete="username"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: '#ffffff',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.82rem',
                    py: 0.8,
                  },
                }}
              />
            </Box>

            {/* Password Field */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '0.74rem',
                  mb: 0.4,
                  display: 'block',
                }}
              >
                Password <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
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
                        <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#94a3b8', p: 0.5 }}
                        >
                          {showPassword ? (
                            <VisibilityOffIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: '#ffffff',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.82rem',
                    py: 0.8,
                  },
                }}
              />
            </Box>

            {/* Primary Sign In Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              startIcon={
                submitting ? (
                  <CircularProgress size={15} color="inherit" />
                ) : (
                  <LoginIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{
                mt: 0.5,
                height: 36,
                bgcolor: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.82rem',
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                },
              }}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          {/* Minimal 1-Click Demo Accounts Selector */}
          <Box
            sx={{
              mt: 2.5,
              pt: 2,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500 }}>
              Demo Accounts:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip
                label="Admin"
                size="small"
                onClick={() => handleQuickFill('admin', 'admin123', 'admin')}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: selectedRole === 'admin' ? 700 : 500,
                  bgcolor: selectedRole === 'admin' ? '#eff6ff' : '#f8fafc',
                  color: selectedRole === 'admin' ? '#1d4ed8' : '#64748b',
                  border: `1px solid ${selectedRole === 'admin' ? '#bfdbfe' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#eff6ff', borderColor: '#bfdbfe' },
                }}
              />
              <Chip
                label="Manager"
                size="small"
                onClick={() => handleQuickFill('manager', 'manager123', 'manager')}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: selectedRole === 'manager' ? 700 : 500,
                  bgcolor: selectedRole === 'manager' ? '#fefce8' : '#f8fafc',
                  color: selectedRole === 'manager' ? '#a16207' : '#64748b',
                  border: `1px solid ${selectedRole === 'manager' ? '#fef08a' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#fefce8', borderColor: '#fef08a' },
                }}
              />
              <Chip
                label="Accountant"
                size="small"
                onClick={() => handleQuickFill('accountant', 'account123', 'accountant')}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: selectedRole === 'accountant' ? 700 : 500,
                  bgcolor: selectedRole === 'accountant' ? '#f0fdf4' : '#f8fafc',
                  color: selectedRole === 'accountant' ? '#15803d' : '#64748b',
                  border: `1px solid ${selectedRole === 'accountant' ? '#bbf7d0' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f0fdf4', borderColor: '#bbf7d0' },
                }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

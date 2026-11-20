import React, { useState } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography, Button } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import { theme } from './theme';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { IncomePage } from './pages/IncomePage';
import { ReportsPage } from './pages/ReportsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfficeProvider } from './context/OfficeContext';
import { hasPermission } from './utils/permissions';

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('Dashboard');

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#ffffff',
        }}
      >
        <CircularProgress size={32} sx={{ color: '#18181b' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderAccessDenied = (feature: string) => (
    <Box
      sx={{
        py: 8,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '16px',
          bgcolor: '#fafafa',
          border: '1px solid #e4e4e7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <ShieldIcon sx={{ fontSize: 26, color: '#eab308' }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#09090b', fontFamily: '"Space Grotesk", sans-serif' }}>
        Access Restricted
      </Typography>
      <Typography variant="body2" sx={{ color: '#71717a', maxWidth: 420, mt: 0.8, fontSize: '0.84rem' }}>
        Your assigned role (<strong>{currentUser?.role || 'Viewer'}</strong>) does not have sufficient permission to access {feature}. Please contact an Administrator if you require elevated privileges.
      </Typography>
      <Button
        variant="contained"
        size="small"
        onClick={() => setActiveTab('Dashboard')}
        sx={{
          mt: 2.5,
          borderRadius: '9999px',
          bgcolor: '#18181b',
          color: '#ffffff',
          fontWeight: 600,
          px: 2.4,
          '&:hover': { bgcolor: '#27272a' },
        }}
      >
        Return to Dashboard
      </Button>
    </Box>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'Expenses':
        return <ExpensesPage />;
      case 'Income':
        return <IncomePage />;
      case 'Reports':
        return <ReportsPage />;
      case 'Categories':
        return hasPermission(currentUser?.role, 'MANAGE_CATEGORIES') ? <CategoriesPage /> : renderAccessDenied('category configuration');
      case 'Users':
        return hasPermission(currentUser?.role, 'MANAGE_USERS') ? <UsersPage /> : renderAccessDenied('user accounts');
      default:
        return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {renderContent()}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <OfficeProvider>
          <AppContent />
        </OfficeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

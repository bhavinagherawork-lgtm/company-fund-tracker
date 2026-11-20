import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Chip,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import TableChartIcon from '@mui/icons-material/TableChart';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import { initializeDatabase } from '../database/db';
import { getFinancialSummary } from '../services/reportService';
import { formatINR } from '../utils/currency';
import { AddExpenseDialog } from '../components/AddExpenseDialog';
import { AddIncomeDialog } from '../components/AddIncomeDialog';
import { ExcelSyncDialog } from '../components/ExcelSyncDialog';
import { OfficesDialog } from '../components/OfficesDialog';
import { subscribeToSyncStatus, type SyncStatusState } from '../services/syncService';
import { useAuth } from '../context/AuthContext';
import { useOffice } from '../context/OfficeContext';
import { hasPermission } from '../utils/permissions';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  Dashboard: { title: 'Executive Overview', subtitle: 'Real-time financial summary & expenditure metrics' },
  Expenses: { title: 'Expenses Ledger', subtitle: 'Track, filter, and audit operational cash outflows' },
  Income: { title: 'Income & Inflows', subtitle: 'Record fund transfers and manage liquid deposits' },
  Reports: { title: 'Financial Reports', subtitle: 'Structured weekly & monthly accounting statements' },
  Categories: { title: 'Category Management', subtitle: 'Organize and classify organizational expenditures' },
  Users: { title: 'User Management', subtitle: 'Role-based access control and system accounts' },
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeTab, onSelectTab }) => {
  const { currentUser, logout } = useAuth();
  const { offices, selectedOfficeId, selectedOffice, setSelectedOfficeId } = useOffice();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('expenseflow_sidebar_collapsed') === 'true';
  });
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [officeMenuAnchor, setOfficeMenuAnchor] = useState<null | HTMLElement>(null);

  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [openIncomeModal, setOpenIncomeModal] = useState(false);
  const [openSyncModal, setOpenSyncModal] = useState(false);
  const [openOfficesModal, setOpenOfficesModal] = useState(false);

  const [syncState, setSyncState] = useState<SyncStatusState>({
    hasFileHandle: false,
    fileName: null,
    lastSyncedAt: null,
    isSyncing: false,
    googleSheetSyncing: false,
    autoSaveEnabled: true,
    lastError: null,
  });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('expenseflow_sidebar_collapsed', String(next));
      return next;
    });
  };

  const fetchBalance = async () => {
    try {
      await initializeDatabase();
      const summary = await getFinancialSummary(selectedOfficeId);
      setAvailableBalance(summary.availableBalance);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 3000);
    const unsubscribeSync = subscribeToSyncStatus((st) => setSyncState(st));
    return () => {
      clearInterval(interval);
      unsubscribeSync();
    };
  }, [selectedOfficeId]);

  // Role-Based Access Control: Filter navigation items based on user permissions (Rule 5.2 & 5.3)
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 19 }} />, id: 'Dashboard', permission: 'VIEW_DASHBOARD' as const },
    { text: 'Expenses', icon: <ReceiptLongIcon sx={{ fontSize: 19 }} />, id: 'Expenses', permission: 'VIEW_EXPENSES' as const },
    { text: 'Income & Funds', icon: <AccountBalanceWalletIcon sx={{ fontSize: 19 }} />, id: 'Income', permission: 'VIEW_INCOME' as const },
    { text: 'Reports', icon: <AssessmentIcon sx={{ fontSize: 19 }} />, id: 'Reports', permission: 'VIEW_REPORTS' as const },
    { text: 'Categories', icon: <CategoryIcon sx={{ fontSize: 19 }} />, id: 'Categories', permission: 'MANAGE_CATEGORIES' as const },
    { text: 'Users', icon: <PeopleIcon sx={{ fontSize: 19 }} />, id: 'Users', permission: 'MANAGE_USERS' as const },
  ].filter((item) => hasPermission(currentUser?.role, item.permission));

  const currentTabInfo = TAB_TITLES[activeTab] || { title: activeTab, subtitle: 'Operations & Fund Manager' };
  const sidebarWidth = sidebarCollapsed ? 60 : 208;

  // Sidebar List Content (ReUI Component Navigation - Compact Black Sidebar)
  const renderNavList = (isDrawer = false) => (
    <List sx={{ px: 0.8, py: 0.8, flexGrow: 1 }}>
      {navItems.map((item) => {
        const isSelected = activeTab === item.id;
        const button = (
          <ListItemButton
            selected={isSelected}
            onClick={() => {
              onSelectTab(item.id);
              if (isDrawer) setMobileMenuOpen(false);
            }}
            sx={{
              borderRadius: '9999px',
              mb: 0.35,
              py: 0.5,
              px: !isDrawer && sidebarCollapsed ? 1.0 : 1.4,
              minHeight: 34,
              justifyContent: !isDrawer && sidebarCollapsed ? 'center' : 'flex-start',
              bgcolor: isSelected ? '#2563eb !important' : 'transparent',
              color: isSelected ? '#ffffff !important' : '#94a3b8',
              boxShadow: isSelected ? '0 2px 10px rgba(37, 99, 235, 0.35)' : 'none',
              transition: 'all 150ms ease',
              '&.Mui-selected': {
                bgcolor: '#2563eb !important',
                color: '#ffffff !important',
                '& .MuiTypography-root': {
                  color: '#ffffff !important',
                  fontWeight: 600,
                },
                '& .MuiListItemText-primary': {
                  color: '#ffffff !important',
                  fontWeight: 600,
                },
                '& .MuiListItemIcon-root': {
                  color: '#ffffff !important',
                },
              },
              '&:hover': {
                bgcolor: isSelected ? '#1d4ed8 !important' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff !important',
                '& .MuiTypography-root': {
                  color: '#ffffff !important',
                },
                '& .MuiListItemText-primary': {
                  color: '#ffffff !important',
                },
                '& .MuiListItemIcon-root': {
                  color: isSelected ? '#ffffff !important' : '#60a5fa !important',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: !isDrawer && sidebarCollapsed ? 0 : 28,
                color: isSelected ? '#ffffff !important' : '#94a3b8',
                justifyContent: 'center',
                transition: 'color 150ms ease',
                '& .MuiSvgIcon-root': {
                  fontSize: 18,
                },
              }}
            >
              {item.icon}
            </ListItemIcon>
            {(isDrawer || !sidebarCollapsed) && (
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  sx: {
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 600 : 500,
                    letterSpacing: '-0.01em',
                    color: isSelected ? '#ffffff !important' : '#cbd5e1',
                  },
                }}
              />
            )}
          </ListItemButton>
        );

        return (
          <ListItem key={item.id} disablePadding>
            {!isDrawer && sidebarCollapsed ? (
              <Tooltip title={item.text} placement="right" arrow>
                {button}
              </Tooltip>
            ) : (
              button
            )}
          </ListItem>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff', display: 'flex' }}>
      {/* ================= DESKTOP SIDEBAR ================= */}
      {!isMobile && (
        <Box
          component="aside"
          sx={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            height: '100vh',
            position: 'sticky',
            top: 0,
            bgcolor: '#09090b', // BLACK SIDEBAR
            borderRight: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1100,
            transition: 'width 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            overflowX: 'hidden',
          }}
        >
          {/* Sidebar Brand Header */}
          <Box
            sx={{
              height: 46,
              minHeight: 46,
              px: sidebarCollapsed ? 1.0 : 1.6,
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            }}
          >
            <Box
              onClick={() => onSelectTab('Dashboard')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.0,
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  minWidth: 28,
                  borderRadius: '8px',
                  bgcolor: '#2563eb', // User Primary Blue
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                }}
              >
                <AccountBalanceWalletIcon sx={{ color: '#ffffff', fontSize: 16 }} />
              </Box>
              {!sidebarCollapsed && (
                <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      lineHeight: 1.1,
                      color: '#ffffff', // Crisp white on black
                      fontSize: '0.88rem',
                      fontFamily: '"Space Grotesk", sans-serif',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ExpenseFlow
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8', // Muted light slate on black
                      fontSize: '0.62rem',
                      display: 'block',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Operations & Funds
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Navigation Links */}
          {renderNavList(false)}

          {/* Sidebar Footer / Collapse Toggle */}
          <Box
            sx={{
              p: 1.2,
              borderTop: '1px solid #1e293b',
              bgcolor: '#09090b',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.8,
            }}
          >
            {!sidebarCollapsed && (
              <Box
                sx={{
                  px: 1.2,
                  py: 0.6,
                  borderRadius: '9999px',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                }}
              >
                <CorporateFareIcon sx={{ fontSize: 14, color: '#60a5fa' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {selectedOfficeId === 'ALL' ? 'All Offices' : selectedOffice?.name || 'Office'}
                </Typography>
              </Box>
            )}

            <Tooltip title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'} placement="right">
              <Button
                size="small"
                fullWidth
                onClick={toggleSidebarCollapse}
                sx={{
                  color: '#94a3b8',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 0.6,
                  borderRadius: '9999px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  minWidth: 0,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' },
                }}
                startIcon={
                  sidebarCollapsed ? (
                    <ChevronRightIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                  ) : (
                    <ChevronLeftIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                  )
                }
              >
                {!sidebarCollapsed && 'Collapse Menu'}
              </Button>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* ================= RIGHT AREA: TOP HEADER + MAIN CONTENT ================= */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* ================= TOP NAVBAR ================= */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            top: 0,
            zIndex: 1050,
            bgcolor: 'rgba(255, 255, 255, 0.98)',
            color: '#1a1a1a',
            borderBottom: '1px solid #e6e6e6',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Toolbar
            sx={{
              minHeight: '46px !important',
              height: 46,
              px: { xs: 1.2, sm: 1.8, md: 2.2 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.0,
              width: '100%',
            }}
          >
            {/* Left: Mobile Toggle & Page Context Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.0, minWidth: 0 }}>
              {isMobile ? (
                <IconButton
                  color="inherit"
                  edge="start"
                  size="small"
                  onClick={() => setMobileMenuOpen(true)}
                  sx={{ color: '#1a1a1a', p: 0.5 }}
                >
                  <MenuIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton
                  size="small"
                  onClick={toggleSidebarCollapse}
                  sx={{ color: '#4d4d4d', p: 0.5, '&:hover': { color: '#1a1a1a', bgcolor: '#f3f4f6' } }}
                  title={sidebarCollapsed ? 'Expand Menu' : 'Collapse Menu'}
                >
                  {sidebarCollapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
                </IconButton>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0, overflow: 'hidden' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '0.86rem', sm: '0.96rem' },
                    color: '#1a1a1a',
                    fontFamily: '"Space Grotesk", sans-serif',
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentTabInfo.title}
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    color: '#4d4d4d',
                    display: { xs: 'none', xl: 'inline' },
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  • {currentTabInfo.subtitle}
                </Typography>
              </Box>

              {selectedOfficeId !== 'ALL' && (
                <Chip
                  icon={<CorporateFareIcon sx={{ fontSize: '12px !important', color: '#2563eb !important' }} />}
                  label={selectedOffice?.name || 'Office'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    bgcolor: '#fafafa',
                    color: '#1a1a1a',
                    border: '1px solid #e6e6e6',
                    borderRadius: '9999px',
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                />
              )}
            </Box>

            {/* Right: Operational Controls & Tools (Office Switcher, Sync, Balance, Quick Actions, User) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.6, sm: 0.9 }, flexShrink: 0 }}>
              {/* Global Office Switcher */}
              <Tooltip title="Filter whole system by Office / Branch or manage branches">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => setOfficeMenuAnchor(e.currentTarget)}
                  startIcon={<CorporateFareIcon sx={{ fontSize: 14, color: '#2563eb !important' }} />}
                  endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 13 }} />}
                  sx={{
                    height: 28,
                    px: { xs: 0.9, sm: 1.2 },
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    borderColor: '#e6e6e6',
                    bgcolor: '#ffffff',
                    color: '#1a1a1a',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#2563eb',
                      bgcolor: '#f8fafc',
                    },
                  }}
                >
                  <Box component="span" sx={{ maxWidth: { xs: 90, sm: 130 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedOfficeId === 'ALL' ? 'All Offices' : selectedOffice?.name || 'Office'}
                  </Box>
                </Button>
              </Tooltip>

              <Menu
                anchorEl={officeMenuAnchor}
                open={Boolean(officeMenuAnchor)}
                onClose={() => setOfficeMenuAnchor(null)}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      minWidth: 240,
                      borderRadius: '16px',
                      border: '1px solid #e6e6e6',
                      boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)',
                      p: 0.8,
                    },
                  },
                }}
              >
                <Box sx={{ px: 1.5, py: 0.8 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#4d4d4d', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    System Office Scope
                  </Typography>
                </Box>

                <MenuItem
                  selected={selectedOfficeId === 'ALL'}
                  onClick={() => {
                    setSelectedOfficeId('ALL');
                    setOfficeMenuAnchor(null);
                  }}
                  sx={{ fontSize: '0.82rem', py: 0.8, borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <CorporateFareIcon sx={{ fontSize: 17, color: '#4d4d4d' }} />
                    <span style={{ fontWeight: 600 }}>All Offices (Consolidated)</span>
                  </Box>
                  {selectedOfficeId === 'ALL' && <CheckIcon sx={{ fontSize: 16, color: '#2563eb' }} />}
                </MenuItem>

                <Divider sx={{ my: 0.8 }} />

                {offices.map((off) => (
                  <MenuItem
                    key={off.id}
                    selected={selectedOfficeId === off.id}
                    onClick={() => {
                      if (off.id) setSelectedOfficeId(off.id);
                      setOfficeMenuAnchor(null);
                    }}
                    sx={{ fontSize: '0.82rem', py: 0.8, borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '6px',
                          bgcolor: off.isDefault ? '#eff6ff' : '#f3f4f6',
                          color: off.isDefault ? '#2563eb' : '#4d4d4d',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {off.code}
                      </Box>
                      <span style={{ fontWeight: 500 }}>{off.name}</span>
                    </Box>
                    {selectedOfficeId === off.id && <CheckIcon sx={{ fontSize: 16, color: '#2563eb' }} />}
                  </MenuItem>
                ))}

                <Divider sx={{ my: 0.8 }} />

                <MenuItem
                  onClick={() => {
                    setOfficeMenuAnchor(null);
                    setOpenOfficesModal(true);
                  }}
                  sx={{ fontSize: '0.8rem', py: 0.8, borderRadius: '8px', color: '#2563eb', fontWeight: 600 }}
                >
                  Manage Offices / Branches...
                </MenuItem>
              </Menu>

              {/* Excel Sync Status Button - Currently commented out & hidden from screen per user request */}
              {/*
              <Tooltip title={syncState.hasFileHandle ? `Live Excel Sync Active: ${syncState.fileName}` : 'Connect Excel or Google Sheet for live 2-way sync'}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    syncState.hasFileHandle ? (
                      <CheckCircleIcon sx={{ fontSize: 16, color: '#16a34a !important' }} />
                    ) : (
                      <TableChartIcon sx={{ fontSize: 16, color: '#2563eb !important' }} />
                    )
                  }
                  onClick={() => setOpenSyncModal(true)}
                  sx={{
                    height: 28,
                    px: { xs: 0.9, sm: 1.2 },
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    borderColor: syncState.hasFileHandle ? '#bbf7d0' : '#e6e6e6',
                    bgcolor: syncState.hasFileHandle ? '#f0fdf4' : '#ffffff',
                    color: syncState.hasFileHandle ? '#15803d' : '#1a1a1a',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#2563eb',
                      bgcolor: '#f8fafc',
                    },
                  }}
                >
                  {syncState.hasFileHandle ? (
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Excel Linked</Box>
                  ) : (
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Excel & Sheet Sync</Box>
                  )}
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Sync</Box>
                </Button>
              </Tooltip>
              */}

              {/* Available Balance Pill (ReUI Style) */}
              {availableBalance !== null && (
                <Chip
                  icon={<AccountBalanceWalletIcon sx={{ color: '#16a34a !important', fontSize: '14px !important' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#4d4d4d', fontWeight: 600, fontSize: '0.68rem', display: { xs: 'none', lg: 'inline' } }}>
                        Balance:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: availableBalance >= 0 ? '#15803d' : '#dc2626',
                          fontFamily: '"Space Mono", monospace',
                          fontSize: '0.78rem',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {formatINR(availableBalance)}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    bgcolor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    height: 28,
                    px: 0.8,
                    borderRadius: '9999px',
                  }}
                />
              )}

              {/* Income Button (Status Accent Green Pill) */}
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => setOpenIncomeModal(true)}
                sx={{
                  fontWeight: 600,
                  borderRadius: '9999px',
                  bgcolor: '#16a34a',
                  color: '#ffffff',
                  height: 28,
                  px: 1.4,
                  fontSize: '0.74rem',
                  textTransform: 'none',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': { bgcolor: '#15803d', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)' },
                }}
              >
                Income
              </Button>

              {/* Expense Button (Primary Royal Blue Pill) */}
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => setOpenExpenseModal(true)}
                sx={{
                  fontWeight: 600,
                  borderRadius: '9999px',
                  bgcolor: '#2563eb',
                  color: '#ffffff',
                  height: 28,
                  px: 1.4,
                  fontSize: '0.74rem',
                  textTransform: 'none',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' },
                }}
              >
                Expense
              </Button>

              {/* User Profile & Logout Menu */}
              {currentUser && (
                <>
                  <Box
                    onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      cursor: 'pointer',
                      p: '2px 8px 2px 3px',
                      borderRadius: '9999px',
                      bgcolor: '#ffffff',
                      border: '1px solid #e6e6e6',
                      transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        borderColor: '#2563eb',
                        bgcolor: '#f8fafc',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        bgcolor: '#2563eb',
                        color: '#ffffff',
                      }}
                    >
                      {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                    </Avatar>
                    <Box sx={{ display: { xs: 'none', md: 'block' }, lineHeight: 1.1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.74rem', display: 'block' }}>
                        {currentUser.fullName.split(' ')[0]}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.64rem' }}>
                        {currentUser.role}
                      </Typography>
                    </Box>
                  </Box>

                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 1,
                          width: 230,
                          borderRadius: '16px',
                          border: '1px solid #e6e6e6',
                          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)',
                          p: 0.8,
                        },
                      },
                    }}
                  >
                    <Box sx={{ p: '10px 14px' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.86rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                        {currentUser.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.72rem', display: 'block', mt: 0.2 }}>
                        @{currentUser.username} {currentUser.email ? `• ${currentUser.email}` : ''}
                      </Typography>
                      <Chip
                        label={currentUser.role}
                        size="small"
                        sx={{
                          mt: 0.8,
                          bgcolor: currentUser.role === 'Admin' ? '#eff6ff' : '#f3f4f6',
                          color: currentUser.role === 'Admin' ? '#1d4ed8' : '#4d4d4d',
                          border: currentUser.role === 'Admin' ? '1px solid #bfdbfe' : '1px solid #e6e6e6',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20,
                          borderRadius: '9999px',
                        }}
                      />
                    </Box>
                    <Divider sx={{ my: 0.8 }} />
                    <MenuItem
                      onClick={() => {
                        onSelectTab('Users');
                        setUserMenuAnchor(null);
                      }}
                      sx={{ fontSize: '0.82rem', py: 0.9, borderRadius: '8px', gap: 1.2 }}
                    >
                      <PeopleIcon sx={{ fontSize: 17, color: '#4d4d4d' }} />
                      <span style={{ fontWeight: 500 }}>Manage Users</span>
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setUserMenuAnchor(null);
                        logout();
                      }}
                      sx={{ fontSize: '0.82rem', py: 0.9, borderRadius: '8px', gap: 1.2, color: '#dc2626' }}
                    >
                      <LogoutIcon sx={{ fontSize: 17, color: '#dc2626' }} />
                      <span style={{ fontWeight: 600 }}>Sign Out / Logout</span>
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* ================= MAIN CONTENT CONTAINER ================= */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: '1600px',
            mx: 'auto',
            p: { xs: 1.2, sm: 1.6, md: 2.0 },
            bgcolor: '#ffffff',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* ================= MOBILE DRAWER MENU ================= */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 260,
            bgcolor: '#09090b', // BLACK
            borderRight: '1px solid #1e293b',
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 1.8, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AccountBalanceWalletIcon sx={{ color: '#ffffff', fontSize: 17 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff', fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.9rem' }}>ExpenseFlow</Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.64rem', fontWeight: 600, textTransform: 'uppercase' }}>Operations & Funds</Typography>
          </Box>
        </Box>

        {renderNavList(true)}

        <Box sx={{ p: 1.6, mt: 'auto', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          <Button
            variant="contained"
            fullWidth
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setOpenIncomeModal(true);
              setMobileMenuOpen(false);
            }}
            sx={{ bgcolor: '#16a34a', color: '#ffffff', fontWeight: 600, borderRadius: '9999px', height: 30, fontSize: '0.74rem', '&:hover': { bgcolor: '#15803d' } }}
          >
            Add Income
          </Button>
          <Button
            variant="contained"
            fullWidth
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setOpenExpenseModal(true);
              setMobileMenuOpen(false);
            }}
            sx={{ bgcolor: '#2563eb', color: '#ffffff', fontWeight: 600, borderRadius: '9999px', height: 30, fontSize: '0.74rem', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            Add Expense
          </Button>
          {/* Excel & Sheet Sync - Currently commented out & hidden from screen per user request */}
          {/*
          <Button
            variant="outlined"
            fullWidth
            size="small"
            startIcon={<SyncIcon />}
            onClick={() => {
              setOpenSyncModal(true);
              setMobileMenuOpen(false);
            }}
            sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', fontWeight: 600, borderRadius: '9999px', height: 30, fontSize: '0.74rem', '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.06)' } }}
          >
            Excel & Sheet Sync
          </Button>
          */}
          {currentUser && (
            <Button
              variant="outlined"
              color="error"
              fullWidth
              size="small"
              startIcon={<LogoutIcon />}
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              sx={{ fontWeight: 600, mt: 0.3, borderRadius: '9999px', height: 30, fontSize: '0.74rem' }}
            >
              Sign Out ({currentUser.username})
            </Button>
          )}
        </Box>
      </Drawer>

      {/* ================= MODALS ================= */}
      <AddExpenseDialog
        open={openExpenseModal}
        onClose={() => setOpenExpenseModal(false)}
        onSuccess={fetchBalance}
      />
      <AddIncomeDialog
        open={openIncomeModal}
        onClose={() => setOpenIncomeModal(false)}
        onSuccess={fetchBalance}
      />
      {/* ExcelSyncDialog - Currently commented out & hidden from screen per user request */}
      {/*
      <ExcelSyncDialog
        open={openSyncModal}
        onClose={() => setOpenSyncModal(false)}
        onDataChanged={fetchBalance}
      />
      */}
      <OfficesDialog
        open={openOfficesModal}
        onClose={() => setOpenOfficesModal(false)}
      />
    </Box>
  );
};

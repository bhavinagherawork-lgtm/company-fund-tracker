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

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 19 }} />, id: 'Dashboard' },
    { text: 'Expenses', icon: <ReceiptLongIcon sx={{ fontSize: 19 }} />, id: 'Expenses' },
    { text: 'Income & Funds', icon: <AccountBalanceWalletIcon sx={{ fontSize: 19 }} />, id: 'Income' },
    { text: 'Reports', icon: <AssessmentIcon sx={{ fontSize: 19 }} />, id: 'Reports' },
    { text: 'Categories', icon: <CategoryIcon sx={{ fontSize: 19 }} />, id: 'Categories' },
    { text: 'Users', icon: <PeopleIcon sx={{ fontSize: 19 }} />, id: 'Users' },
  ];

  const currentTabInfo = TAB_TITLES[activeTab] || { title: activeTab, subtitle: 'Operations & Fund Manager' };
  const sidebarWidth = sidebarCollapsed ? 70 : 236;

  // Sidebar List Content (Used for Desktop Sidebar & Mobile Drawer)
  const renderNavList = (isDrawer = false) => (
    <List sx={{ px: 1, py: 1.2, flexGrow: 1 }}>
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
              borderRadius: '8px',
              mb: 0.6,
              py: 0.9,
              px: !isDrawer && sidebarCollapsed ? 1.5 : 1.6,
              justifyContent: !isDrawer && sidebarCollapsed ? 'center' : 'flex-start',
              bgcolor: isSelected ? '#0052ff !important' : 'transparent',
              color: isSelected ? '#ffffff !important' : '#334155',
              boxShadow: isSelected ? '0 2px 8px rgba(0, 82, 255, 0.28)' : 'none',
              transition: 'all 120ms ease-in-out',
              '&:hover': {
                bgcolor: isSelected ? '#0042cc !important' : '#f1f5f9',
                color: isSelected ? '#ffffff' : '#0f172a',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: !isDrawer && sidebarCollapsed ? 0 : 34,
                color: isSelected ? '#ffffff !important' : '#64748b',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {(isDrawer || !sidebarCollapsed) && (
              <ListItemText
                primary={item.text}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: '0.84rem',
                      fontWeight: isSelected ? 800 : 600,
                      letterSpacing: '-0.1px',
                    },
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex' }}>
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
            bgcolor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1100,
            transition: 'width 180ms cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
          }}
        >
          {/* Sidebar Brand Header */}
          <Box
            sx={{
              height: 56,
              minHeight: 56,
              px: sidebarCollapsed ? 1.5 : 2,
              borderBottom: '1px solid #e2e8f0',
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
                gap: 1.2,
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: '8px',
                  bgcolor: '#0052ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 82, 255, 0.3)',
                }}
              >
                <AccountBalanceWalletIcon sx={{ color: '#ffffff', fontSize: 19 }} />
              </Box>
              {!sidebarCollapsed && (
                <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      lineHeight: 1.15,
                      color: '#0a0b0d',
                      fontSize: '0.92rem',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    ExpenseFlow
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.64rem', display: 'block', fontWeight: 600 }}>
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
              borderTop: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.8,
            }}
          >
            {!sidebarCollapsed && (
              <Box
                sx={{
                  px: 1,
                  py: 0.6,
                  borderRadius: '6px',
                  bgcolor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                }}
              >
                <CorporateFareIcon sx={{ fontSize: 14, color: '#0052ff' }} />
                <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                  color: '#64748b',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 0.6,
                  borderRadius: '6px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  minWidth: 0,
                  '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                }}
                startIcon={
                  sidebarCollapsed ? (
                    <ChevronRightIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <ChevronLeftIcon sx={{ fontSize: 18 }} />
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
            bgcolor: '#ffffff',
            color: '#0a0b0d',
            borderBottom: '1px solid #e2e8f0',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Toolbar
            sx={{
              minHeight: '56px !important',
              height: 56,
              px: { xs: 1.5, sm: 2, md: 2.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              width: '100%',
            }}
          >
            {/* Left: Mobile Toggle & Page Context Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
              {isMobile ? (
                <IconButton
                  color="inherit"
                  edge="start"
                  size="small"
                  onClick={() => setMobileMenuOpen(true)}
                  sx={{ color: '#0f172a' }}
                >
                  <MenuIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton
                  size="small"
                  onClick={toggleSidebarCollapse}
                  sx={{ color: '#64748b', '&:hover': { color: '#0052ff', bgcolor: '#eff6ff' } }}
                  title={sidebarCollapsed ? 'Expand Menu' : 'Collapse Menu'}
                >
                  {sidebarCollapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
                </IconButton>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.88rem', sm: '1.02rem' },
                    color: '#0a0b0d',
                    letterSpacing: '-0.3px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentTabInfo.title}
                </Typography>

                {selectedOfficeId !== 'ALL' && (
                  <Chip
                    icon={<CorporateFareIcon sx={{ fontSize: '13px !important', color: '#1e40af !important' }} />}
                    label={selectedOffice?.name || 'Office'}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      bgcolor: '#eff6ff',
                      color: '#1e40af',
                      border: '1px solid #bfdbfe',
                      display: { xs: 'none', sm: 'inline-flex' },
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Right: Operational Controls & Tools (Office Switcher, Sync, Balance, Quick Actions, User) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1 }, flexShrink: 0 }}>
              {/* Global Office Switcher */}
              <Tooltip title="Filter whole system by Office / Branch or manage branches">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => setOfficeMenuAnchor(e.currentTarget)}
                  startIcon={<CorporateFareIcon sx={{ fontSize: 16, color: '#0052ff !important' }} />}
                  endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    height: 32,
                    px: { xs: 1, sm: 1.2 },
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    borderColor: selectedOfficeId !== 'ALL' ? '#bfdbfe' : '#e2e8f0',
                    bgcolor: selectedOfficeId !== 'ALL' ? '#eff6ff' : '#f8fafc',
                    color: selectedOfficeId !== 'ALL' ? '#1e40af' : '#334155',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#0052ff',
                      bgcolor: '#eff6ff',
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
                      minWidth: 230,
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      p: 0.5,
                    },
                  },
                }}
              >
                <Box sx={{ px: 1.5, py: 0.8 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    System Office Scope
                  </Typography>
                </Box>

                <MenuItem
                  selected={selectedOfficeId === 'ALL'}
                  onClick={() => {
                    setSelectedOfficeId('ALL');
                    setOfficeMenuAnchor(null);
                  }}
                  sx={{ fontSize: '0.78rem', py: 0.7, borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CorporateFareIcon sx={{ fontSize: 16, color: '#64748b' }} />
                    <span>All Offices (Consolidated)</span>
                  </Box>
                  {selectedOfficeId === 'ALL' && <CheckIcon sx={{ fontSize: 15, color: '#0052ff' }} />}
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                {offices.map((off) => (
                  <MenuItem
                    key={off.id}
                    selected={selectedOfficeId === off.id}
                    onClick={() => {
                      if (off.id) setSelectedOfficeId(off.id);
                      setOfficeMenuAnchor(null);
                    }}
                    sx={{ fontSize: '0.78rem', py: 0.7, borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '4px',
                          bgcolor: off.isDefault ? '#dbeafe' : '#f1f5f9',
                          color: off.isDefault ? '#1e40af' : '#475569',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {off.code}
                      </Box>
                      <span>{off.name}</span>
                    </Box>
                    {selectedOfficeId === off.id && <CheckIcon sx={{ fontSize: 15, color: '#0052ff' }} />}
                  </MenuItem>
                ))}

                <Divider sx={{ my: 0.5 }} />

                <MenuItem
                  onClick={() => {
                    setOfficeMenuAnchor(null);
                    setOpenOfficesModal(true);
                  }}
                  sx={{ fontSize: '0.76rem', py: 0.7, borderRadius: '4px', color: '#0052ff', fontWeight: 700 }}
                >
                  + Manage Offices / Branches...
                </MenuItem>
              </Menu>

              {/* Excel Sync Status Button */}
              <Tooltip title={syncState.hasFileHandle ? `Live Excel Sync Active: ${syncState.fileName}` : 'Connect Excel or Google Sheet for live 2-way sync'}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    syncState.hasFileHandle ? (
                      <CheckCircleIcon sx={{ fontSize: 15, color: '#05b169 !important' }} />
                    ) : (
                      <TableChartIcon sx={{ fontSize: 15, color: '#0052ff !important' }} />
                    )
                  }
                  onClick={() => setOpenSyncModal(true)}
                  sx={{
                    height: 32,
                    px: { xs: 1, sm: 1.2 },
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    borderColor: syncState.hasFileHandle ? '#a7f3d0' : '#e2e8f0',
                    bgcolor: syncState.hasFileHandle ? '#ecfdf5' : '#f5f8ff',
                    color: syncState.hasFileHandle ? '#065f46' : '#0052ff',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#0052ff',
                      bgcolor: '#eef3ff',
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

              {/* Available Balance Pill */}
              {availableBalance !== null && (
                <Chip
                  icon={<AccountBalanceWalletIcon sx={{ color: '#05b169 !important', fontSize: '15px !important' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#5b616e', fontWeight: 600, fontSize: '0.7rem', display: { xs: 'none', lg: 'inline' } }}>
                        Balance:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: '#05b169',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {formatINR(availableBalance)}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    bgcolor: '#f5f8ff',
                    border: '1px solid #e2e8f0',
                    height: 32,
                    px: 0.6,
                    borderRadius: '6px',
                  }}
                />
              )}

              {/* + Income Button */}
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                onClick={() => setOpenIncomeModal(true)}
                sx={{
                  fontWeight: 700,
                  borderRadius: '6px',
                  bgcolor: '#05b169',
                  height: 32,
                  px: 1.3,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': { bgcolor: '#048e54' },
                }}
              >
                + Income
              </Button>

              {/* + Expense Button */}
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                onClick={() => setOpenExpenseModal(true)}
                sx={{
                  fontWeight: 700,
                  borderRadius: '6px',
                  bgcolor: '#0052ff',
                  height: 32,
                  px: 1.3,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': { bgcolor: '#0042cc' },
                }}
              >
                + Expense
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
                      p: '3px 8px 3px 4px',
                      borderRadius: '20px',
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: '#eff6ff',
                        borderColor: '#bfdbfe',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 26,
                        height: 26,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        bgcolor: currentUser.role === 'Admin' ? '#0052ff' : '#64748b',
                      }}
                    >
                      {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                    </Avatar>
                    <Box sx={{ display: { xs: 'none', md: 'block' }, lineHeight: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.72rem', display: 'block' }}>
                        {currentUser.fullName.split(' ')[0]}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem' }}>
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
                          width: 220,
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          p: 0.5,
                        },
                      },
                    }}
                  >
                    <Box sx={{ p: '8px 12px' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                        {currentUser.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
                        @{currentUser.username} {currentUser.email ? `• ${currentUser.email}` : ''}
                      </Typography>
                      <Chip
                        label={currentUser.role}
                        size="small"
                        sx={{
                          mt: 0.6,
                          bgcolor: currentUser.role === 'Admin' ? '#dbeafe' : '#f1f5f9',
                          color: currentUser.role === 'Admin' ? '#1e40af' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.62rem',
                          height: 18,
                        }}
                      />
                    </Box>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem
                      onClick={() => {
                        onSelectTab('Users');
                        setUserMenuAnchor(null);
                      }}
                      sx={{ fontSize: '0.78rem', py: 0.8, borderRadius: '4px', gap: 1 }}
                    >
                      <PeopleIcon sx={{ fontSize: 16, color: '#0052ff' }} />
                      Manage Users
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setUserMenuAnchor(null);
                        logout();
                      }}
                      sx={{ fontSize: '0.78rem', py: 0.8, borderRadius: '4px', gap: 1, color: '#dc2626' }}
                    >
                      <LogoutIcon sx={{ fontSize: 16, color: '#dc2626' }} />
                      Sign Out / Logout
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
            p: { xs: 1.5, sm: 2.2, md: 2.8 },
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
            bgcolor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#0052ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AccountBalanceWalletIcon sx={{ color: '#ffffff', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0a0b0d' }}>ExpenseFlow</Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>Operations & Funds</Typography>
          </Box>
        </Box>

        {renderNavList(true)}

        <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setOpenIncomeModal(true);
              setMobileMenuOpen(false);
            }}
            sx={{ bgcolor: '#05b169', fontWeight: 700 }}
          >
            + Add Income
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
            sx={{ bgcolor: '#0052ff', fontWeight: 700 }}
          >
            + Add Expense
          </Button>
          <Button
            variant="outlined"
            fullWidth
            size="small"
            startIcon={<SyncIcon />}
            onClick={() => {
              setOpenSyncModal(true);
              setMobileMenuOpen(false);
            }}
            sx={{ borderColor: '#0052ff', color: '#0052ff', fontWeight: 700 }}
          >
            Excel & Sheet Sync
          </Button>
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
              sx={{ fontWeight: 700, mt: 0.5 }}
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
      <ExcelSyncDialog
        open={openSyncModal}
        onClose={() => setOpenSyncModal(false)}
        onDataChanged={fetchBalance}
      />
      <OfficesDialog
        open={openOfficesModal}
        onClose={() => setOpenOfficesModal(false)}
      />
    </Box>
  );
};

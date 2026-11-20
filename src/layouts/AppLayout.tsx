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
  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  // Sidebar List Content (Pill Navigation Item Styling per Reui)
  const renderNavList = (isDrawer = false) => (
    <List sx={{ px: 1.2, py: 1.5, flexGrow: 1 }}>
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
              borderRadius: '9999px', // --radius-pill-button
              mb: 0.8,
              py: 0.9,
              px: !isDrawer && sidebarCollapsed ? 1.5 : 2,
              justifyContent: !isDrawer && sidebarCollapsed ? 'center' : 'flex-start',
              bgcolor: isSelected ? '#18181b !important' : 'transparent',
              color: isSelected ? '#ffffff !important' : '#71717a',
              boxShadow: isSelected ? '0 2px 8px rgba(24, 24, 27, 0.18)' : 'none',
              transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                bgcolor: isSelected ? '#27272a !important' : '#f4f4f5',
                color: isSelected ? '#ffffff' : '#09090b',
                transform: 'translateX(2px)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: !isDrawer && sidebarCollapsed ? 0 : 34,
                color: isSelected ? '#eab308 !important' : '#71717a',
                justifyContent: 'center',
                transition: 'color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
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
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 700 : 500,
                      fontFamily: isSelected ? '"Space Grotesk", sans-serif' : 'Inter, sans-serif',
                      letterSpacing: '-0.01em',
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', display: 'flex' }}>
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
            borderRight: '1px solid #e4e4e7',
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
              height: 60,
              minHeight: 60,
              px: sidebarCollapsed ? 1.5 : 2.2,
              borderBottom: '1px solid #e4e4e7',
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
                gap: 1.4,
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  minWidth: 34,
                  borderRadius: '10px',
                  bgcolor: '#18181b', // Obsidian Brand Container
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(24, 24, 27, 0.25)',
                  border: '1px solid #27272a',
                }}
              >
                <AccountBalanceWalletIcon sx={{ color: '#eab308', fontSize: 20 }} />
              </Box>
              {!sidebarCollapsed && (
                <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      lineHeight: 1.15,
                      color: '#09090b',
                      fontSize: '0.98rem',
                      fontFamily: '"Space Grotesk", sans-serif',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ExpenseFlow
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#71717a',
                      fontSize: '0.66rem',
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
              p: 1.4,
              borderTop: '1px solid #e4e4e7',
              bgcolor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.8,
            }}
          >
            {!sidebarCollapsed && (
              <Box
                sx={{
                  px: 1.2,
                  py: 0.7,
                  borderRadius: '9999px',
                  bgcolor: '#fafafa',
                  border: '1px solid #e4e4e7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                }}
              >
                <CorporateFareIcon sx={{ fontSize: 15, color: '#eab308' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#09090b',
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
                  color: '#71717a',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 0.7,
                  borderRadius: '9999px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  minWidth: 0,
                  '&:hover': { bgcolor: '#f4f4f5', color: '#09090b' },
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
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            color: '#09090b',
            borderBottom: '1px solid #e4e4e7',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Toolbar
            sx={{
              minHeight: '60px !important',
              height: 60,
              px: { xs: 1.5, sm: 2.2, md: 3 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              width: '100%',
            }}
          >
            {/* Left: Mobile Toggle & Page Context Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, minWidth: 0 }}>
              {isMobile ? (
                <IconButton
                  color="inherit"
                  edge="start"
                  size="small"
                  onClick={() => setMobileMenuOpen(true)}
                  sx={{ color: '#09090b' }}
                >
                  <MenuIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton
                  size="small"
                  onClick={toggleSidebarCollapse}
                  sx={{ color: '#71717a', '&:hover': { color: '#09090b', bgcolor: '#f4f4f5' } }}
                  title={sidebarCollapsed ? 'Expand Menu' : 'Collapse Menu'}
                >
                  {sidebarCollapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
                </IconButton>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '0.92rem', sm: '1.05rem' },
                    color: '#09090b',
                    fontFamily: '"Space Grotesk", sans-serif',
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentTabInfo.title}
                </Typography>

                {selectedOfficeId !== 'ALL' && (
                  <Chip
                    icon={<CorporateFareIcon sx={{ fontSize: '13px !important', color: '#18181b !important' }} />}
                    label={selectedOffice?.name || 'Office'}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      bgcolor: '#fafafa',
                      color: '#09090b',
                      border: '1px solid #e4e4e7',
                      borderRadius: '9999px',
                      display: { xs: 'none', sm: 'inline-flex' },
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Right: Operational Controls & Tools (Office Switcher, Sync, Balance, Quick Actions, User) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 }, flexShrink: 0 }}>
              {/* Global Office Switcher */}
              <Tooltip title="Filter whole system by Office / Branch or manage branches">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => setOfficeMenuAnchor(e.currentTarget)}
                  startIcon={<CorporateFareIcon sx={{ fontSize: 16, color: '#eab308 !important' }} />}
                  endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    height: 34,
                    px: { xs: 1.2, sm: 1.6 },
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    borderColor: '#e4e4e7',
                    bgcolor: '#ffffff',
                    color: '#09090b',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#18181b',
                      bgcolor: '#fafafa',
                    },
                  }}
                >
                  <Box component="span" sx={{ maxWidth: { xs: 90, sm: 140 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      border: '1px solid #e4e4e7',
                      boxShadow: '0 8px 24px -4px rgba(0,0,0,0.1)',
                      p: 0.8,
                    },
                  },
                }}
              >
                <Box sx={{ px: 1.5, py: 0.8 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                    <CorporateFareIcon sx={{ fontSize: 17, color: '#71717a' }} />
                    <span style={{ fontWeight: 600 }}>All Offices (Consolidated)</span>
                  </Box>
                  {selectedOfficeId === 'ALL' && <CheckIcon sx={{ fontSize: 16, color: '#18181b' }} />}
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
                          bgcolor: off.isDefault ? '#18181b' : '#f4f4f5',
                          color: off.isDefault ? '#eab308' : '#71717a',
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
                    {selectedOfficeId === off.id && <CheckIcon sx={{ fontSize: 16, color: '#18181b' }} />}
                  </MenuItem>
                ))}

                <Divider sx={{ my: 0.8 }} />

                <MenuItem
                  onClick={() => {
                    setOfficeMenuAnchor(null);
                    setOpenOfficesModal(true);
                  }}
                  sx={{ fontSize: '0.8rem', py: 0.8, borderRadius: '8px', color: '#18181b', fontWeight: 600 }}
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
                      <CheckCircleIcon sx={{ fontSize: 16, color: '#22c55e !important' }} />
                    ) : (
                      <TableChartIcon sx={{ fontSize: 16, color: '#18181b !important' }} />
                    )
                  }
                  onClick={() => setOpenSyncModal(true)}
                  sx={{
                    height: 34,
                    px: { xs: 1.2, sm: 1.6 },
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    borderColor: syncState.hasFileHandle ? '#bbf7d0' : '#e4e4e7',
                    bgcolor: syncState.hasFileHandle ? '#f0fdf4' : '#ffffff',
                    color: syncState.hasFileHandle ? '#15803d' : '#09090b',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#18181b',
                      bgcolor: '#fafafa',
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

              {/* Available Balance Pill (Obsidian Executive Style) */}
              {availableBalance !== null && (
                <Chip
                  icon={<AccountBalanceWalletIcon sx={{ color: '#22c55e !important', fontSize: '16px !important' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Typography variant="caption" sx={{ color: '#a1a1aa', fontWeight: 600, fontSize: '0.72rem', display: { xs: 'none', lg: 'inline' } }}>
                        Balance:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: '#22c55e',
                          fontFamily: '"Space Mono", monospace',
                          fontSize: '0.82rem',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {formatINR(availableBalance)}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    bgcolor: '#18181b',
                    border: '1px solid #27272a',
                    height: 34,
                    px: 1,
                    borderRadius: '9999px',
                  }}
                />
              )}

              {/* + Income Button (Vibrant Status Accent Pill) */}
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={() => setOpenIncomeModal(true)}
                sx={{
                  fontWeight: 600,
                  borderRadius: '9999px',
                  bgcolor: '#22c55e',
                  color: '#ffffff',
                  height: 34,
                  px: 1.8,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': { bgcolor: '#16a34a' },
                }}
              >
                + Income
              </Button>

              {/* + Expense Button (Obsidian Primary CTA Pill) */}
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={() => setOpenExpenseModal(true)}
                sx={{
                  fontWeight: 600,
                  borderRadius: '9999px',
                  bgcolor: '#18181b',
                  color: '#ffffff',
                  height: 34,
                  px: 1.8,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': { bgcolor: '#27272a' },
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
                      gap: 1,
                      cursor: 'pointer',
                      p: '3px 10px 3px 4px',
                      borderRadius: '9999px',
                      bgcolor: '#ffffff',
                      border: '1px solid #e4e4e7',
                      transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        borderColor: '#18181b',
                        bgcolor: '#fafafa',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        bgcolor: '#18181b',
                        color: '#eab308',
                      }}
                    >
                      {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                    </Avatar>
                    <Box sx={{ display: { xs: 'none', md: 'block' }, lineHeight: 1.1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#09090b', fontSize: '0.74rem', display: 'block' }}>
                        {currentUser.fullName.split(' ')[0]}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.64rem' }}>
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
                          border: '1px solid #e4e4e7',
                          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.1)',
                          p: 0.8,
                        },
                      },
                    }}
                  >
                    <Box sx={{ p: '10px 14px' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#09090b', fontSize: '0.86rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                        {currentUser.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.72rem', display: 'block', mt: 0.2 }}>
                        @{currentUser.username} {currentUser.email ? `• ${currentUser.email}` : ''}
                      </Typography>
                      <Chip
                        label={currentUser.role}
                        size="small"
                        sx={{
                          mt: 0.8,
                          bgcolor: currentUser.role === 'Admin' ? '#18181b' : '#f4f4f5',
                          color: currentUser.role === 'Admin' ? '#eab308' : '#71717a',
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
                      <PeopleIcon sx={{ fontSize: 17, color: '#71717a' }} />
                      <span style={{ fontWeight: 500 }}>Manage Users</span>
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setUserMenuAnchor(null);
                        logout();
                      }}
                      sx={{ fontSize: '0.82rem', py: 0.9, borderRadius: '8px', gap: 1.2, color: '#ef4444' }}
                    >
                      <LogoutIcon sx={{ fontSize: 17, color: '#ef4444' }} />
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
            p: { xs: 1.5, sm: 2.5, md: 3.2 },
            bgcolor: '#fafafa',
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
            width: 270,
            bgcolor: '#ffffff',
            borderRight: '1px solid #e4e4e7',
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2.2, borderBottom: '1px solid #e4e4e7', display: 'flex', alignItems: 'center', gap: 1.4 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AccountBalanceWalletIcon sx={{ color: '#eab308', fontSize: 19 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#09090b', fontFamily: '"Space Grotesk", sans-serif' }}>ExpenseFlow</Typography>
            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>Operations & Funds</Typography>
          </Box>
        </Box>

        {renderNavList(true)}

        <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setOpenIncomeModal(true);
              setMobileMenuOpen(false);
            }}
            sx={{ bgcolor: '#22c55e', color: '#ffffff', fontWeight: 600, borderRadius: '9999px' }}
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
            sx={{ bgcolor: '#18181b', color: '#ffffff', fontWeight: 600, borderRadius: '9999px' }}
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
            sx={{ borderColor: '#e4e4e7', color: '#09090b', fontWeight: 600, borderRadius: '9999px' }}
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
              sx={{ fontWeight: 600, mt: 0.5, borderRadius: '9999px' }}
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

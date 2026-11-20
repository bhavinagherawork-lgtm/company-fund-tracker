import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid2 as Grid,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  CircularProgress,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import type { User, UserRole, UserStatus } from '../types';

export const UsersPage: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('Viewer');
  const [status, setStatus] = useState<UserStatus>('Active');

  // Notification Banner
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const loadUsersList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setAlertMessage({ type: 'error', text: err.message || 'Failed to load users.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsersList();
  }, [loadUsersList]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('Viewer');
    setStatus('Active');
    setModalError(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setEmail(user.email || '');
    setPassword(''); // leave blank to keep unchanged
    setRole(user.role);
    setStatus(user.status);
    setModalError(null);
    setOpenModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!fullName.trim()) {
      setModalError('Full name is required.');
      return;
    }
    if (!username.trim()) {
      setModalError('Username is required.');
      return;
    }

    if (!editingUser && !password.trim()) {
      setModalError('Password is required for new users.');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        // Update user
        const updates: Partial<User> = {
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim(),
          role,
          status,
        };
        if (password.trim()) {
          updates.passwordHash = password.trim();
        }
        await updateUser(editingUser.id!, updates);
        setAlertMessage({ type: 'success', text: `User "${username}" updated successfully!` });
      } else {
        // Create user
        await createUser({
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim(),
          passwordHash: password.trim(),
          role,
          status,
        });
        setAlertMessage({ type: 'success', text: `User "${username}" created successfully!` });
      }

      await loadUsersList();
      await refreshUser();
      setOpenModal(false);
    } catch (err: any) {
      setModalError(err.message || 'Error saving user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!user.id) return;

    // MANDATORY USER REQUIREMENT CHECK
    if (users.length <= 1) {
      setAlertMessage({
        type: 'error',
        text: 'Action Forbidden: At least one User entry is mandatory in the User table. The system prevents deleting the final user.',
      });
      return;
    }

    if (currentUser?.id === user.id) {
      setAlertMessage({
        type: 'error',
        text: 'Action Forbidden: You cannot delete your currently active session user.',
      });
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete user "${user.username}" (${user.fullName})?`)) {
      try {
        await deleteUser(user.id, currentUser?.id);
        setAlertMessage({ type: 'success', text: `User "${user.username}" deleted successfully.` });
        await loadUsersList();
      } catch (err: any) {
        setAlertMessage({ type: 'error', text: err.message || 'Failed to delete user.' });
      }
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = u.fullName.toLowerCase().includes(q);
        const mUser = u.username.toLowerCase().includes(q);
        const mEmail = u.email ? u.email.toLowerCase().includes(q) : false;
        if (!mName && !mUser && !mEmail) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchTerm]);

  // KPIs
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.status === 'Active').length;
  const adminCount = users.filter((u) => u.role === 'Admin').length;

  const getRoleColor = (userRole: UserRole) => {
    switch (userRole) {
      case 'Admin':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'Manager':
        return { bg: '#fefce8', color: '#a16207', border: '#fef08a' };
      case 'Accountant':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
      default:
        return { bg: '#f4f4f5', color: '#4d4d4d', border: '#e6e6e6' };
    }
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ pb: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontFamily: '"Space Grotesk", sans-serif', letterSpacing: "-0.02em" }}>
            User Management & Access Control
          </Typography>
          <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.72rem' }}>
            Manage team login credentials, administrative security roles, and user directory
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={<PersonAddIcon sx={{ fontSize: 16 }} />}
          onClick={handleOpenAdd}
          sx={{
            fontWeight: 700,
            px: 1.5,
            borderRadius: '9999px',
            bgcolor: '#2563eb',
            color: '#ffffff',
            height: 30,
            fontSize: '0.75rem',
            textTransform: 'none',
            '&:hover': { bgcolor: '#1d4ed8', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' },
          }}
        >
          Add New User
        </Button>
      </Box>

      {/* Mandatory User Requirement Notice Banner */}
      <Alert
        severity="info"
        icon={<ShieldIcon sx={{ fontSize: 18, color: '#2563eb' }} />}
        sx={{
          mb: 1.8,
          borderRadius: '16px',
          py: 0.5,
          fontSize: '0.76rem',
          bgcolor: '#ffffff',
          color: '#1a1a1a',
          border: '1px solid #e6e6e6',
        }}
      >
        <strong>Mandatory User Policy:</strong> At least one User entry is strictly mandatory in the User table. The system enforces continuous data integrity and blocks deleting the final active user.
      </Alert>

      {alertMessage && (
        <Alert
          severity={alertMessage.type}
          onClose={() => setAlertMessage(null)}
          sx={{ mb: 1.8, borderRadius: '9999px', py: 0.5, fontSize: '0.8rem' }}
        >
          {alertMessage.text}
        </Alert>
      )}

      {/* KPI Cards (60-30-10 Highlighter Rule: Clean structural borders, reserved accents) */}
      <Grid container spacing={1.5} sx={{ mb: 1.8 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ border: '1px solid #e4e4e7', borderRadius: '16px' }}>
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Total Users
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: '"Space Mono", monospace', fontSize: '1.1rem', mt: 0.3 }}>
                    {totalUsersCount} Accounts
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.68rem', mt: 0.3, display: 'block' }}>
                    Enrolled system profiles
                  </Typography>
                </Box>
                <Box sx={{ p: 0.8, bgcolor: '#eff6ff', borderRadius: '9999px', border: '1px solid #bfdbfe' }}>
                  <PeopleIcon sx={{ color: '#2563eb', fontSize: 18 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ border: '1px solid #e4e4e7', borderRadius: '16px' }}>
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Active Users
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e', fontFamily: '"Space Mono", monospace', fontSize: '1.1rem', mt: 0.3 }}>
                    {activeUsersCount} Active
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.68rem', mt: 0.3, display: 'block' }}>
                    Permitted to authenticate
                  </Typography>
                </Box>
                <Box sx={{ p: 0.8, bgcolor: '#f0fdf4', borderRadius: '9999px' }}>
                  <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 18 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ border: '1px solid #e4e4e7', borderRadius: '16px' }}>
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Administrators
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2563eb', fontFamily: '"Space Mono", monospace', fontSize: '1.1rem', mt: 0.3 }}>
                    {adminCount} Admins
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.68rem', mt: 0.3, display: 'block' }}>
                    Full operational authority
                  </Typography>
                </Box>
                <Box sx={{ p: 0.8, bgcolor: '#eff6ff', borderRadius: '9999px' }}>
                  <AdminPanelSettingsIcon sx={{ color: '#2563eb', fontSize: 18 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ border: '1px solid #e4e4e7', borderRadius: '16px' }}>
            <CardContent sx={{ p: '12px 14px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    Policy Status
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', color: '#eab308', fontSize: '1.0rem', mt: 0.3 }}>
                    Mandatory 1+
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.68rem', mt: 0.3, display: 'block' }}>
                    Protected from zero users
                  </Typography>
                </Box>
                <Box sx={{ p: 0.8, bgcolor: '#fffbeb', borderRadius: '9999px' }}>
                  <SecurityIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter & Search Toolbar */}
      <Card sx={{ mb: 1.8, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: '10px 14px !important' }}>
          <Grid container spacing={1.2} alignItems="center">
            {/* Search */}
            <Grid size={{ xs: 12, sm: 5, md: 5 }}>
              <TextField
                placeholder="Search name, username, or email..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#5b616e', fontSize: 17 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.7 } }}
              />
            </Grid>

            {/* Role Filter */}
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <TextField
                select
                label="Role"
                fullWidth
                size="small"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Roles</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Accountant">Accountant</MenuItem>
                <MenuItem value="Viewer">Viewer</MenuItem>
              </TextField>
            </Grid>

            {/* Status Filter */}
            <Grid size={{ xs: 6, sm: 2, md: 2 }}>
              <TextField
                select
                label="Status"
                fullWidth
                size="small"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Grid>

            {/* Reset */}
            <Grid size={{ xs: 12, sm: 2, md: 2 }} sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
              {(searchTerm.trim() || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <Chip label={`${filteredUsers.length} found`} size="small" sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700, fontSize: '0.7rem' }} />
              )}
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
                sx={{ height: 32, fontSize: '0.75rem', fontWeight: 600, borderColor: '#e4e4e7', minWidth: 64 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#71717a', fontSize: '0.72rem', py: 1 }}>USER PROFILE</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#71717a', fontSize: '0.72rem', py: 1 }}>EMAIL ADDRESS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#71717a', fontSize: '0.72rem', py: 1 }}>SECURITY ROLE</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#71717a', fontSize: '0.72rem', py: 1 }}>STATUS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#71717a', fontSize: '0.72rem', py: 1 }}>LAST LOGIN</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: '#71717a', fontSize: '0.72rem', py: 1 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#71717a' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} /> Loading user profiles...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#71717a', fontSize: '0.8rem' }}>
                  No users found matching your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                const roleTheme = getRoleColor(u.role);
                const isOnlyUser = users.length <= 1;
                const isCurrent = currentUser?.id === u.id;

                return (
                  <TableRow key={u.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    {/* User Profile */}
                    <TableCell sx={{ py: 0.8 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            bgcolor: u.role === 'Admin' ? '#2563eb' : '#64748b',
                            color: '#ffffff',
                          }}
                        >
                          {getAvatarInitials(u.fullName)}
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                              {u.fullName}
                            </Typography>
                            {isCurrent && (
                              <Chip
                                label="YOU"
                                size="small"
                                sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 800, fontSize: '0.58rem', height: 16 }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem', display: 'block', fontFamily: '"Space Mono", monospace' }}>
                            @{u.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Email */}
                    <TableCell sx={{ py: 0.8, color: '#0f172a', fontSize: '0.8rem' }}>
                      {u.email || <span style={{ color: '#a1a1aa' }}>—</span>}
                    </TableCell>

                    {/* Security Role */}
                    <TableCell sx={{ py: 0.8 }}>
                      <Chip
                        label={u.role}
                        size="small"
                        sx={{
                          bgcolor: roleTheme.bg,
                          color: roleTheme.color,
                          border: `1px solid ${roleTheme.border}`,
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          height: 20,
                        }}
                      />
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={{ py: 0.8 }}>
                      <Chip
                        label={u.status}
                        size="small"
                        sx={{
                          bgcolor: u.status === 'Active' ? '#f0fdf4' : '#f4f4f5',
                          color: u.status === 'Active' ? '#22c55e' : '#71717a',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          height: 20,
                        }}
                      />
                    </TableCell>

                    {/* Last Login */}
                    <TableCell sx={{ py: 0.8, color: '#71717a', fontSize: '0.75rem', fontFamily: '"Space Mono", monospace' }}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center" sx={{ py: 0.8 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.4 }}>
                        <Tooltip title="Edit User Profile">
                          <IconButton size="small" onClick={() => handleOpenEdit(u)} sx={{ p: 0.4, color: '#2563eb' }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        {/* Delete Button with Mandatory 1 User Guard */}
                        {isOnlyUser ? (
                          <Tooltip title="Mandatory Safeguard: Cannot delete the only remaining user in User Table.">
                            <span>
                              <IconButton size="small" disabled sx={{ p: 0.4, color: '#d4d4d8' }}>
                                <LockIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : isCurrent ? (
                          <Tooltip title="Cannot delete your own logged-in account.">
                            <span>
                              <IconButton size="small" disabled sx={{ p: 0.4, color: '#d4d4d8' }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Delete User">
                            <IconButton size="small" onClick={() => handleDeleteUser(u)} sx={{ p: 0.4, color: '#ef4444' }}>
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit User Modal */}
      <Dialog sx={{ "& .MuiDialog-paper": { borderRadius: "24px" } }} open={openModal} onClose={() => !saving && setOpenModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '0.98rem', pb: 1, borderBottom: '1px solid #e2e8f0' }}>
          {editingUser ? `Edit User: @${editingUser.username}` : 'Add New User'}
        </DialogTitle>

        <form onSubmit={handleSaveUser}>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1.8 }}>
            {modalError && (
              <Alert severity="error" sx={{ borderRadius: '9999px', fontSize: '0.75rem', py: 0.2 }} onClose={() => setModalError(null)}>
                {modalError}
              </Alert>
            )}

            <TextField
              label="Full Name"
              required
              fullWidth
              size="small"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
            />

            <TextField
              label="Username"
              required
              fullWidth
              size="small"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="e.g. johndoe"
              helperText="Unique username used for login"
            />

            <TextField
              label="Email Address"
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@company.com"
            />

            <TextField
              label={editingUser ? 'New Password (leave blank to keep unchanged)' : 'Password'}
              type="password"
              required={!editingUser}
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Grid container spacing={1.2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  select
                  label="Role"
                  fullWidth
                  size="small"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Accountant">Accountant</MenuItem>
                  <MenuItem value="Viewer">Viewer</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  size="small"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserStatus)}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #e2e8f0', gap: 1 }}>
            <Button onClick={() => setOpenModal(false)} disabled={saving} size="small" sx={{ fontWeight: 600, borderRadius: '9999px', textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              size="small"
              sx={{ bgcolor: '#2563eb', color: '#ffffff', fontWeight: 700, px: 2, borderRadius: '9999px', textTransform: 'none', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

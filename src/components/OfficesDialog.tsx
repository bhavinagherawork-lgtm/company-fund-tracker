import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Card,
  CardContent,
  Chip,
  Alert,
  Tooltip,
  CircularProgress,
  Grid2 as Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useOffice } from '../context/OfficeContext';
import { createOffice, updateOffice, deleteOffice } from '../services/officeService';
import { db } from '../database/db';
import { formatINR } from '../utils/currency';
import { officeZodSchema, formatZodErrors } from '../utils/validators';
import type { Office } from '../types';

interface OfficesDialogProps {
  open: boolean;
  onClose: () => void;
}

export const OfficesDialog: React.FC<OfficesDialogProps> = ({ open, onClose }) => {
  const { offices, refreshOffices } = useOffice();
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Office Metrics
  const [metrics, setMetrics] = useState<Record<number, { expCount: number; expTotal: number; incCount: number; incTotal: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadOfficeMetrics = async () => {
    try {
      const expenses = await db.expenseRecords.toArray();
      const incomes = await db.incomeRecords.toArray();
      const map: Record<number, { expCount: number; expTotal: number; incCount: number; incTotal: number }> = {};

      for (const off of offices) {
        if (!off.id) continue;
        const offExp = expenses.filter(e => e.officeId === off.id && e.status === 'Completed');
        const offInc = incomes.filter(i => i.officeId === off.id && !i.isVoid);
        map[off.id] = {
          expCount: offExp.length,
          expTotal: offExp.reduce((a, b) => a + Number(b.amount || 0), 0),
          incCount: offInc.length,
          incTotal: offInc.reduce((a, b) => a + Number(b.amount || 0), 0),
        };
      }
      setMetrics(map);
    } catch {
      // ignore
    }
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setError(null);
      setFieldErrors({});
      setSuccessMsg(null);
      setIsAdding(false);
      setEditingOffice(null);
      loadOfficeMetrics();
    }
  }, [open, offices]);

  const handleOpenAdd = () => {
    setEditingOffice(null);
    setName('');
    setCode('');
    setLocation('');
    setIsDefault(offices.length === 0);
    setIsAdding(true);
    setError(null);
    setFieldErrors({});
  };

  const handleOpenEdit = (off: Office) => {
    setEditingOffice(off);
    setName(off.name);
    setCode(off.code);
    setLocation(off.location || '');
    setIsDefault(!!off.isDefault);
    setIsAdding(true);
    setError(null);
    setFieldErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const validation = officeZodSchema.safeParse({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      location: location.trim() || undefined,
    });

    if (!validation.success) {
      const errMap = formatZodErrors(validation.error);
      setFieldErrors(errMap);
      setError(Object.values(errMap)[0] || 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (editingOffice?.id) {
        await updateOffice(editingOffice.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          location: location.trim(),
          isDefault,
        });
        setSuccessMsg(`Office "${name}" updated successfully!`);
      } else {
        await createOffice({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          location: location.trim(),
          isDefault,
          status: 'Active',
        });
        setSuccessMsg(`New office "${name}" created successfully!`);
      }
      await refreshOffices();
      setIsAdding(false);
      setEditingOffice(null);
    } catch (err: any) {
      setError(err.message || 'Error saving office.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (off: Office) => {
    if (!off.id) return;
    if (window.confirm(`Are you sure you want to delete office "${off.name}"?`)) {
      try {
        await deleteOffice(off.id);
        setSuccessMsg(`Office "${off.name}" deleted.`);
        await refreshOffices();
      } catch (err: any) {
        setError(err.message || 'Error deleting office.');
      }
    }
  };

  return (
    <Dialog sx={{ "& .MuiDialog-paper": { borderRadius: "16px" } }} open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25, px: 2, borderBottom: '1px solid #e6e6e6' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CorporateFareIcon sx={{ color: '#2563eb', fontSize: 18 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.92rem', color: '#1a1a1a' }}>
            Office & Branch Management
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#4d4d4d' }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: '8px', fontSize: '0.75rem', py: 0.3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 1.5, borderRadius: '8px', fontSize: '0.75rem', py: 0.3 }} onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {/* Add/Edit Form */}
        {isAdding ? (
          <Card sx={{ mb: 1.5, borderRadius: '12px', border: '1px solid #2563eb', bgcolor: '#f8fafc' }}>
            <CardContent sx={{ p: '10px 12px !important' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem', mb: 1.5 }}>
                {editingOffice ? `Edit Office: ${editingOffice.name}` : 'Add New Office / Branch'}
              </Typography>

              <form noValidate onSubmit={handleSave}>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 8 }}>
                    <TextField
                      label="Office Name"
                      required
                      fullWidth
                      size="small"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) {
                          setFieldErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.name;
                            return copy;
                          });
                        }
                      }}
                      error={Boolean(fieldErrors.name)}
                      helperText={fieldErrors.name}
                      placeholder="e.g. Surat Head Office"
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <TextField
                      label="Code"
                      required
                      fullWidth
                      size="small"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        if (fieldErrors.code) {
                          setFieldErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.code;
                            return copy;
                          });
                        }
                      }}
                      error={Boolean(fieldErrors.code)}
                      helperText={fieldErrors.code}
                      placeholder="e.g. HO"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Location / Address"
                      fullWidth
                      size="small"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Ring Road, Surat, Gujarat"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingOffice(null);
                    }}
                    disabled={loading}
                    sx={{ fontSize: '0.75rem', fontWeight: 600, borderRadius: '9999px', textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    disabled={loading}
                    sx={{ bgcolor: '#2563eb', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, borderRadius: '9999px', textTransform: 'none', '&:hover': { bgcolor: '#1d4ed8' } }}
                  >
                    {loading ? <CircularProgress size={14} color="inherit" /> : editingOffice ? 'Update Office' : 'Save Office'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
            <Typography variant="caption" sx={{ color: '#4d4d4d', fontSize: '0.75rem', fontWeight: 600 }}>
              The system organizes transactions, reports, and balances by office.
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 15 }} />}
              onClick={handleOpenAdd}
              sx={{ bgcolor: '#2563eb', color: '#ffffff', height: 28, fontSize: '0.72rem', fontWeight: 700, borderRadius: '9999px', textTransform: 'none', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              Add Office
            </Button>
          </Box>
        )}

        {/* Offices List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          {offices.map((off) => {
            const m = off.id ? metrics[off.id] : undefined;
            const expTotal = m?.expTotal || 0;
            const incTotal = m?.incTotal || 0;
            const netBalance = incTotal - expTotal;

            return (
              <Card
                key={off.id}
                sx={{
                  borderRadius: '16px',
                  border: off.isDefault ? '1.5px solid #2563eb' : '1px solid #e6e6e6',
                  bgcolor: off.isDefault ? '#f8fafc' : '#ffffff',
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ p: '12px 14px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '9999px',
                          bgcolor: off.isDefault ? '#eff6ff' : '#f1f5f9',
                          color: off.isDefault ? '#1d4ed8' : '#475569',
                          border: off.isDefault ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                        }}
                      >
                        {off.code}
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                            {off.name}
                          </Typography>
                          {off.isDefault && (
                            <Chip
                              icon={<StarIcon sx={{ fontSize: '11px !important', color: '#1e40af !important' }} />}
                              label="Default HQ"
                              size="small"
                              sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 800, fontSize: '0.62rem', height: 18 }}
                            />
                          )}
                        </Box>
                        {off.location && (
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
                            {off.location}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Edit Office">
                        <IconButton size="small" onClick={() => handleOpenEdit(off)} sx={{ p: 0.4, color: '#2563eb' }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      {!off.isDefault && (
                        <Tooltip title="Delete Office">
                          <IconButton size="small" onClick={() => handleDelete(off)} sx={{ p: 0.4, color: '#ef4444' }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* Financial Stats Bar for Office */}
                  <Box sx={{ display: 'flex', gap: 1.2, mt: 1.2, pt: 1, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                    <Chip
                      label={`Expenses: -${formatINR(expTotal)} (${m?.expCount || 0})`}
                      size="small"
                      sx={{ bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                    />
                    <Chip
                      label={`Funds: +${formatINR(incTotal)} (${m?.incCount || 0})`}
                      size="small"
                      sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                    />
                    <Chip
                      label={`Net: ${formatINR(netBalance)}`}
                      size="small"
                      sx={{
                        bgcolor: netBalance >= 0 ? '#f0fdf4' : '#fef2f2',
                        color: netBalance >= 0 ? '#22c55e' : '#ef4444',
                        fontWeight: 800,
                        fontFamily: '"Space Mono", monospace',
                        fontSize: '0.68rem',
                        height: 20,
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #e6e6e6' }}>
        <Button onClick={onClose} size="small" sx={{ fontWeight: 600, color: '#4d4d4d' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

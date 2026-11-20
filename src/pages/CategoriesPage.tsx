import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid2 as Grid,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Alert,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { resetDatabaseToExcelSeed, db } from '../database/db';
import type { ExpenseCategory } from '../types';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({});
  const [openModal, setOpenModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  // Delete category confirmation dialog
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<ExpenseCategory | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<number | 0>(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#18181b');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    const data = await getCategories();
    setCategories(data);

    // Calculate how many expenses belong to each category
    const allExpenses = await db.expenseRecords.toArray();
    const counts: Record<number, number> = {};
    for (const exp of allExpenses) {
      if (exp.categoryId !== undefined) {
        counts[exp.categoryId] = (counts[exp.categoryId] || 0) + 1;
      }
    }
    setCategoryCounts(counts);
  }, []);

  const handleResetSeed = async () => {
    if (window.confirm('Are you sure you want to re-sync all categories and transactions from the authentic Google Sheets baseline?')) {
      await resetDatabaseToExcelSeed();
      setSyncMsg('Database successfully re-synced with authentic Google Sheets records!');
      await loadCategories();
    }
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setCode('');
    setColor('#18181b');
    setDescription('');
    setError(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setCode(cat.code || '');
    setColor(cat.color || '#18181b');
    setDescription(cat.description || '');
    setError(null);
    setOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }

    try {
      if (editingCategory && editingCategory.id !== undefined) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          code: (code.trim() || name.substring(0, 4).toUpperCase()).replace(/\s+/g, '-'),
          color,
          description: description.trim() || undefined,
        });
        setSyncMsg(`Category "${name}" updated successfully!`);
      } else {
        await addCategory({
          name: name.trim(),
          code: (code.trim() || name.substring(0, 4).toUpperCase()).replace(/\s+/g, '-'),
          color,
          description: description.trim() || undefined,
          isDefault: false,
        });
        setSyncMsg(`Category "${name}" added successfully!`);
      }

      setOpenModal(false);
      setEditingCategory(null);
      await loadCategories();
    } catch (err: any) {
      setError(err?.message || 'Failed to save category. Name may already exist.');
    }
  };

  const handleOpenDelete = (cat: ExpenseCategory) => {
    setDeleteConfirmCat(cat);
    // Default reassignment target to 0 (Uncategorized) or first other category
    const other = categories.find(c => c.id !== cat.id);
    setReassignTargetId(other && other.id ? other.id : 0);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmCat || deleteConfirmCat.id === undefined) return;
    try {
      setIsDeleting(true);
      const catName = deleteConfirmCat.name;
      await deleteCategory(deleteConfirmCat.id, reassignTargetId || undefined);
      setSyncMsg(`Category "${catName}" was deleted successfully! Any associated expenses have been safely reassigned.`);
      setDeleteConfirmCat(null);
      await loadCategories();
    } catch (err: any) {
      alert(`Error deleting category: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ pb: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#09090b", fontFamily: '"Space Grotesk", sans-serif', letterSpacing: "-0.02em" }}>
            Expense Categories
          </Typography>
          <Typography variant="caption" sx={{ color: '#5b616e', fontSize: '0.72rem' }}>
            Organize, edit, and delete company expense types, tags, and colors ({categories.length} Active Categories)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
            onClick={handleResetSeed}
            sx={{ fontWeight: 700, borderRadius: '9999px', borderColor: '#f59e0b', color: '#d97706', height: 30, px: 1.2, fontSize: '0.75rem' }}
          >
            Re-sync Baseline
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={handleOpenAdd}
            sx={{
              fontWeight: 700,
              borderRadius: '9999px',
              bgcolor: '#18181b',
              color: '#ffffff',
              height: 30,
              px: 1.2,
              fontSize: '0.75rem',
              '&:hover': { bgcolor: '#27272a' }
            }}
          >
            + Add Category
          </Button>
        </Box>
      </Box>

      {syncMsg && (
        <Alert severity="success" onClose={() => setSyncMsg(null)} sx={{ mb: 1.8, borderRadius: '9999px', py: 0.5, fontSize: '0.8rem' }}>
          {syncMsg}
        </Alert>
      )}

      {/* Grid of Categories */}
      <Grid container spacing={1.5}>
        {categories.map((cat) => {
          const count = cat.id !== undefined ? (categoryCounts[cat.id] || 0) : 0;
          return (
            <Grid key={cat.id || cat.code} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card sx={{ height: '100%', borderTop: `3px solid ${cat.color}`, borderRadius: '16px', transition: 'box-shadow 150ms ease', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' } }}>
                <CardContent sx={{ p: '12px 14px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: cat.color,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#09090b', fontSize: '0.85rem' }}>
                        {cat.name}
                      </Typography>
                    </Box>

                    {/* Action buttons: Edit & Delete */}
                    <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0 }}>
                      <Tooltip title="Edit Category">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cat)} sx={{ p: 0.4 }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Category">
                        <IconButton size="small" color="error" onClick={() => handleOpenDelete(cat)} sx={{ p: 0.4, '&:hover': { bgcolor: '#fef2f2' } }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                    <Chip
                      label={cat.code}
                      size="small"
                      sx={{ bgcolor: '#f4f4f5', color: '#71717a', fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                    />
                    <Chip
                      label={`${count} ${count === 1 ? 'expense' : 'expenses'}`}
                      size="small"
                      sx={{
                        bgcolor: count > 0 ? '#f0fdf4' : '#fafafa',
                        color: count > 0 ? '#166534' : '#a1a1aa',
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        height: 20,
                        border: `1px solid ${count > 0 ? '#bbf7d0' : '#e4e4e7'}`
                      }}
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', minHeight: 32, fontSize: '0.75rem', lineHeight: 1.4 }}>
                    {cat.description || 'No description provided.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Delete Confirmation Modal */}
      <Dialog sx={{ "& .MuiDialog-paper": { borderRadius: "24px" } }} open={Boolean(deleteConfirmCat)}
        onClose={() => !isDeleting && setDeleteConfirmCat(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ef4444', fontWeight: 800 }}>
          <WarningAmberIcon color="error" />
          Delete Category
        </DialogTitle>
        <DialogContent dividers>
          {deleteConfirmCat && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1.5, color: '#1e293b' }}>
                Are you sure you want to delete category <strong>"{deleteConfirmCat.name}"</strong>?
              </Typography>

              {deleteConfirmCat.id !== undefined && (categoryCounts[deleteConfirmCat.id] || 0) > 0 && (
                <Box sx={{ p: 1.5, bgcolor: '#fffbeb', borderRadius: '9999px', border: '1px solid #fde68a', mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, display: 'block', mb: 1 }}>
                    ⚠️ This category currently has <strong>{categoryCounts[deleteConfirmCat.id]}</strong> recorded expense transactions.
                  </Typography>
                  <TextField
                    select
                    label="Reassign these expenses to"
                    size="small"
                    fullWidth
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(Number(e.target.value))}
                  >
                    <MenuItem value={0}>(Default) Mark as Uncategorized</MenuItem>
                    {categories
                      .filter(c => c.id !== deleteConfirmCat.id)
                      .map(c => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                  </TextField>
                </Box>
              )}

              <Typography variant="caption" sx={{ color: '#71717a', display: 'block' }}>
                This category will be permanently removed. The Excel ledger will automatically reflect the change.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmCat(null)} color="inherit" disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={isDeleting}
            startIcon={<DeleteIcon />}
            sx={{ fontWeight: 700 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Category Dialog */}
      <Dialog sx={{ "& .MuiDialog-paper": { borderRadius: "24px" } }} open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingCategory ? <EditIcon color="primary" /> : <CategoryIcon color="primary" />}
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingCategory ? 'Edit Expense Category' : 'Add Expense Category'}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ p: 2.5 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Category Name"
              placeholder="e.g. Snacks & Refreshments (Nasto)"
              fullWidth
              size="small"
              required
              sx={{ mb: 2 }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <TextField
              label="Category Code (Short Tag)"
              placeholder="e.g. NASTO / ELE-NASTO"
              fullWidth
              size="small"
              sx={{ mb: 2 }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                Tag Color
              </Typography>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: '100%', height: 38, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', padding: 2 }}
              />
            </Box>

            <TextField
              label="Description / Purpose"
              placeholder="What expenses belong in this category..."
              fullWidth
              multiline
              rows={2}
              size="small"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" sx={{ px: 3, fontWeight: 700, bgcolor: '#18181b' }}>
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

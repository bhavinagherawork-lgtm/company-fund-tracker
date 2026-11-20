import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid2 as Grid,
  Typography,
  Alert,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import { getCategories } from '../services/categoryService';
import { addExpense, updateExpense } from '../services/expenseService';
import { useOffice } from '../context/OfficeContext';
import type { ExpenseCategory, PaymentMode, ExpenseRecord } from '../types';
import { getTodayISODate } from '../utils/formatters';

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: ExpenseRecord | null;
}

export const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({
  open,
  onClose,
  onSuccess,
  expenseToEdit,
}) => {
  const { offices, selectedOfficeId, defaultOffice } = useOffice();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  // Form State
  const [expenseDate, setExpenseDate] = useState(getTodayISODate());
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [officeId, setOfficeId] = useState<number | ''>('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [vendor, setVendor] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadCategories();
      setError(null);
      if (expenseToEdit) {
        setExpenseDate(expenseToEdit.expenseDate);
        setCategoryId(expenseToEdit.categoryId);
        setOfficeId(expenseToEdit.officeId || defaultOffice?.id || 1);
        setExpenseTitle(expenseToEdit.expenseTitle);
        setDescription(expenseToEdit.description || '');
        setAmount(expenseToEdit.amount);
        setPaymentMode(expenseToEdit.paymentMode);
        setVendor(expenseToEdit.vendor || '');
        setBillNumber(expenseToEdit.billNumber || '');
        setReceiptFileName(expenseToEdit.receiptFileName || '');
        setReceiptDataUrl(expenseToEdit.receiptDataUrl || '');
      } else {
        setExpenseDate(getTodayISODate());
        setOfficeId(selectedOfficeId !== 'ALL' ? selectedOfficeId : (defaultOffice?.id || 1));
        setExpenseTitle('');
        setDescription('');
        setAmount('');
        setPaymentMode('UPI');
        setVendor('');
        setBillNumber('');
        setReceiptFileName('');
        setReceiptDataUrl('');
      }
    }
  }, [open, expenseToEdit, selectedOfficeId, defaultOffice]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
      if (cats.length > 0 && !expenseToEdit && categoryId === '') {
        setCategoryId(cats[0].id || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!expenseTitle.trim()) {
      setError('Please enter an expense title.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    setLoading(true);
    try {
      const selectedCat = categories.find((c) => c.id === Number(categoryId));
      const selectedOfficeObj = offices.find((o) => o.id === Number(officeId));
      const finalOfficeId = officeId ? Number(officeId) : (defaultOffice?.id || 1);
      const finalOfficeName = selectedOfficeObj?.name || defaultOffice?.name || 'Head Office';

      if (expenseToEdit && expenseToEdit.id !== undefined) {
        await updateExpense(expenseToEdit.id, {
          expenseDate,
          categoryId: Number(categoryId),
          categoryName: selectedCat?.name || 'General',
          officeId: finalOfficeId,
          officeName: finalOfficeName,
          expenseTitle: expenseTitle.trim(),
          description: description.trim() || undefined,
          amount: Number(amount),
          paymentMode,
          vendor: vendor.trim() || undefined,
          billNumber: billNumber.trim() || undefined,
          receiptFileName: receiptFileName || undefined,
          receiptDataUrl: receiptDataUrl || undefined,
        });
      } else {
        await addExpense({
          expenseDate,
          categoryId: Number(categoryId),
          categoryName: selectedCat?.name || 'General',
          officeId: finalOfficeId,
          officeName: finalOfficeName,
          expenseTitle: expenseTitle.trim(),
          description: description.trim() || undefined,
          amount: Number(amount),
          paymentMode,
          vendor: vendor.trim() || undefined,
          billNumber: billNumber.trim() || undefined,
          status: 'Completed',
          receiptFileName: receiptFileName || undefined,
          receiptDataUrl: receiptDataUrl || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record expense.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(expenseToEdit);

  return (
    <Dialog sx={{ "& .MuiDialog-paper": { borderRadius: "24px" } }} open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditing ? <EditIcon color="primary" /> : <ReceiptIcon color="error" />}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {isEditing ? 'Edit Expense Details' : 'Record Day-Wise Expense'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
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

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Expense Date"
                type="date"
                fullWidth
                size="small"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                label="Office / Branch"
                fullWidth
                size="small"
                required
                value={officeId}
                onChange={(e) => setOfficeId(Number(e.target.value))}
              >
                {offices.map((off) => (
                  <MenuItem key={off.id} value={off.id}>
                    {off.name} ({off.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                label="Category"
                fullWidth
                size="small"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Expense Title"
                placeholder="e.g. Elegance Nasto / Tea & Coffee / Stationery"
                fullWidth
                size="small"
                required
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Amount (₹)"
                type="number"
                placeholder="0.00"
                fullWidth
                size="small"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                slotProps={{
                  htmlInput: { min: 0.01, step: 'any' },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Payment Mode"
                fullWidth
                size="small"
                required
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              >
                <MenuItem value="UPI">UPI (GPay / PhonePe / Paytm)</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer (NEFT/RTGS)</MenuItem>
                <MenuItem value="Card">Debit / Credit Card</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Vendor / Store Name"
                placeholder="e.g. Jay Julelal, Chatpuri, Airtel"
                fullWidth
                size="small"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Bill / Invoice Number"
                placeholder="Optional"
                fullWidth
                size="small"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description / Purpose"
                placeholder="Details about what was purchased or approved..."
                fullWidth
                multiline
                rows={2}
                size="small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  bgcolor: '#fafafa',
                }}
              >
                <input
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  id="dialog-receipt-file"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="dialog-receipt-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    size="small"
                    sx={{ mb: 0.5 }}
                  >
                    Attach Bill / Receipt Photo
                  </Button>
                </label>
                {receiptFileName && (
                  <Typography variant="body2" color="text.secondary">
                    Attached: <strong>{receiptFileName}</strong>
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              fontWeight: 700,
              bgcolor: isEditing ? '#18181b' : '#ef4444',
              '&:hover': { bgcolor: isEditing ? '#27272a' : '#dc2626' },
            }}
          >
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Record Expense'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

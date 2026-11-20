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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EditIcon from '@mui/icons-material/Edit';
import { addIncome, updateIncome } from '../services/incomeService';
import { useOffice } from '../context/OfficeContext';
import type { PaymentMode, IncomeRecord } from '../types';
import { getTodayISODate } from '../utils/formatters';

interface AddIncomeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  incomeToEdit?: IncomeRecord | null;
}

export const AddIncomeDialog: React.FC<AddIncomeDialogProps> = ({
  open,
  onClose,
  onSuccess,
  incomeToEdit,
}) => {
  const { offices, selectedOfficeId, defaultOffice } = useOffice();
  const [transactionDate, setTransactionDate] = useState(getTodayISODate());
  const [officeId, setOfficeId] = useState<number | ''>('');
  const [receivedFrom, setReceivedFrom] = useState('Rupesh Sir');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (incomeToEdit) {
        setTransactionDate(incomeToEdit.transactionDate);
        setOfficeId(incomeToEdit.officeId || defaultOffice?.id || 1);
        setReceivedFrom(incomeToEdit.receivedFrom);
        setAmount(incomeToEdit.amount);
        setPaymentMode(incomeToEdit.paymentMode);
        setReferenceNumber(incomeToEdit.referenceNumber || '');
        setDescription(incomeToEdit.description || '');
      } else {
        setTransactionDate(getTodayISODate());
        setOfficeId(selectedOfficeId !== 'ALL' ? selectedOfficeId : (defaultOffice?.id || 1));
        setReceivedFrom('Rupesh Sir');
        setAmount('');
        setPaymentMode('Bank Transfer');
        setReferenceNumber('');
        setDescription('');
      }
    }
  }, [open, incomeToEdit, selectedOfficeId, defaultOffice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!receivedFrom.trim()) {
      setError('Please specify who the fund/income was received from.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setLoading(true);
    try {
      const selectedOfficeObj = offices.find((o) => o.id === Number(officeId));
      const finalOfficeId = officeId ? Number(officeId) : (defaultOffice?.id || 1);
      const finalOfficeName = selectedOfficeObj?.name || defaultOffice?.name || 'Head Office';

      if (incomeToEdit && incomeToEdit.id !== undefined) {
        await updateIncome(incomeToEdit.id, {
          transactionDate,
          officeId: finalOfficeId,
          officeName: finalOfficeName,
          receivedFrom: receivedFrom.trim(),
          amount: Number(amount),
          paymentMode,
          referenceNumber: referenceNumber.trim() || undefined,
          description: description.trim() || undefined,
        });
      } else {
        await addIncome({
          transactionDate,
          officeId: finalOfficeId,
          officeName: finalOfficeName,
          receivedFrom: receivedFrom.trim(),
          amount: Number(amount),
          paymentMode,
          referenceNumber: referenceNumber.trim() || undefined,
          description: description.trim() || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record fund transaction.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(incomeToEdit);

  return (
    <Dialog sx={{ "& .MuiDialog-paper": { borderRadius: "24px" } }} open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditing ? <EditIcon color="primary" /> : <AccountBalanceWalletIcon color="success" />}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {isEditing ? 'Edit Income / Fund Details' : 'Record Income / Fund Received'}
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                size="small"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
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

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Received From / Source"
                placeholder="e.g. Rupesh Sir / Hardikbhai"
                fullWidth
                size="small"
                required
                value={receivedFrom}
                onChange={(e) => setReceivedFrom(e.target.value)}
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
                  htmlInput: { min: 1, step: 'any' },
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
                <MenuItem value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</MenuItem>
                <MenuItem value="UPI">UPI (GPay / PhonePe / Paytm)</MenuItem>
                <MenuItem value="Cash">Cash In Hand</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="Card">Debit / Credit Card</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Reference / UTR / Cheque Number"
                placeholder="e.g. UTR-998812304 / Petty Cash Ref"
                fullWidth
                size="small"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description / Purpose"
                placeholder="e.g. November 1st Tranche Operations Funds"
                fullWidth
                multiline
                rows={2}
                size="small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
            color="success"
            disabled={loading}
            sx={{ fontWeight: 700 }}
          >
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Record Inflow'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

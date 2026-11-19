import { createTheme } from '@mui/material/styles';

/**
 * Minimal & Compact Theme aligned with DESIGN.md specifications
 * - Strict chromatic hierarchy (Fintech Sapphire #0052FF, Accent #05B169)
 * - Utilitarian Density: Compact whitespace, streamlined typography
 * - Clean, lightweight borders and elevation
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0052ff', // --fintech-sapphire-primary
      light: '#3375ff',
      dark: '#0042cc',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#05b169', // --accent-highlight
      light: '#34c487',
      dark: '#048e54',
      contrastText: '#ffffff',
    },
    success: {
      main: '#05b169', // --status-accent
      light: '#34c487',
      dark: '#048e54',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: '#ffffff', // --canvas-base
      paper: '#ffffff',
    },
    text: {
      primary: '#0a0b0d', // --high-contrast-text
      secondary: '#5b616e', // --muted-typography
    },
    divider: '#e2e8f0', // --structural-border
  },
  typography: {
    fontFamily: [
      '"Plus Jakarta Sans"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h4: {
      fontSize: '1.4rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#0a0b0d',
    },
    h5: {
      fontSize: '1.15rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: '#0a0b0d',
    },
    h6: {
      fontSize: '0.95rem',
      fontWeight: 600,
      color: '#0a0b0d',
    },
    body1: {
      fontSize: '14px',
      lineHeight: 1.5,
      color: '#0a0b0d',
    },
    body2: {
      fontSize: '12.5px',
      lineHeight: 1.4,
      color: '#5b616e',
    },
    caption: {
      fontSize: '11.5px',
      color: '#5b616e',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.8125rem',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: 'none',
          padding: '5px 14px',
          fontWeight: 600,
          fontSize: '0.8125rem',
          transition: 'all 160ms cubic-bezier(0.32, 0.72, 0, 1)',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#0052ff',
          '&:hover': {
            backgroundColor: '#0042cc',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          boxShadow: 'none',
          transition: 'border-color 160ms cubic-bezier(0.32, 0.72, 0, 1)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '14px 16px',
          '&:last-child': {
            paddingBottom: '14px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          height: 24,
          fontSize: '0.72rem',
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.8125rem',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#cbd5e1',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0052ff',
            borderWidth: 1.5,
          },
        },
        input: {
          padding: '8px 12px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f5f8ff',
          fontWeight: 700,
          color: '#5b616e',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '7px 12px',
          borderBottom: '1px solid #e2e8f0',
        },
        root: {
          padding: '7px 12px',
          fontSize: '0.8125rem',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
  },
});

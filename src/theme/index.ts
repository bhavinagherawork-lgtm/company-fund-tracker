import { createTheme } from '@mui/material/styles';

/**
 * Clean, Friendly, Modern SaaS Theme Specification
 * Designed for everyday accounting & office management:
 * - Primary Brand / CTA: Royal Blue #2563eb
 * - Contrast & Structure: Deep Slate #0f172a
 * - Canvas Background: Soft Slate-50 #f8fafc (Zero eye strain)
 * - Surface Container: Pure White #ffffff
 * - Structural Border: Crisp Slate #e2e8f0
 * - High-Contrast Text: Slate-900 #0f172a (WCAG AAA)
 * - Muted Typography: Slate-500 #64748b
 * - Inflow / Active Status: Fresh Emerald #10b981
 * - Outflow / Danger: Coral/Rose #ef4444
 * 
 * Typographic Hierarchy:
 * - Friendly, human, modern Inter system stack
 * - Currency / numbers: Space Mono / Inter tabular numerals
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Royal Blue
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f172a', // Deep Slate
      light: '#334155',
      dark: '#020617',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // Fresh Emerald
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // Clean Coral Red
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b', // Amber
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Soft eye-friendly canvas
      paper: '#ffffff', // Clean white card surface
    },
    text: {
      primary: '#0f172a', // High-contrast readable slate
      secondary: '#64748b', // Soft muted labels
    },
    divider: '#e2e8f0', // Crisp structural border
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
      color: '#0f172a',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#0f172a',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#0f172a',
    },
    h4: {
      fontSize: '1.4rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: '#0f172a',
    },
    h5: {
      fontSize: '1.18rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: '#0f172a',
    },
    h6: {
      fontSize: '0.98rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#0f172a',
    },
    subtitle1: {
      fontSize: '0.92rem',
      fontWeight: 600,
      color: '#0f172a',
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontSize: '0.84rem',
      fontWeight: 600,
      color: '#64748b',
    },
    body1: {
      fontSize: '14.5px',
      lineHeight: 1.5,
      color: '#1e293b',
    },
    body2: {
      fontSize: '13px',
      lineHeight: 1.45,
      color: '#64748b',
    },
    caption: {
      fontSize: '12px',
      lineHeight: 1.4,
      color: '#64748b',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.8125rem',
      fontFamily: 'Inter, sans-serif',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'small',
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 9999, // Friendly rounded pill
          boxShadow: 'none',
          padding: '6px 16px',
          fontWeight: 600,
          fontSize: '0.8125rem',
          transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        },
        containedPrimary: {
          backgroundColor: '#2563eb',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#1d4ed8',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          },
        },
        containedSecondary: {
          backgroundColor: '#0f172a',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#1e293b',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
          },
        },
        containedSuccess: {
          backgroundColor: '#10b981',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#059669',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
          },
        },
        outlined: {
          borderColor: '#cbd5e1',
          color: '#1e293b',
          backgroundColor: '#ffffff',
          '&:hover': {
            borderColor: '#94a3b8',
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
          transition: 'box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.07)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
          '&:last-child': {
            paddingBottom: '16px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          height: 25,
          fontSize: '0.74rem',
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: '0.84rem',
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#cbd5e1',
            transition: 'border-color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94a3b8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2563eb',
            borderWidth: 1.5,
          },
        },
        input: {
          padding: '9px 14px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f8fafc',
          fontWeight: 700,
          color: '#475569',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '10px 14px',
          borderBottom: '1px solid #e2e8f0',
          fontFamily: 'Inter, sans-serif',
        },
        root: {
          padding: '10px 14px',
          fontSize: '0.84rem',
          borderBottom: '1px solid #e2e8f0',
          color: '#1e293b',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#2563eb',
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.84rem',
          color: '#64748b',
          '&.Mui-selected': {
            color: '#2563eb',
            fontWeight: 700,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&.Mui-selected': {
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            '& .MuiTypography-root': {
              color: '#1d4ed8',
              fontWeight: 600,
            },
            '& .MuiListItemText-primary': {
              color: '#1d4ed8',
              fontWeight: 600,
            },
            '& .MuiListItemIcon-root': {
              color: '#2563eb',
            },
            '&:hover': {
              backgroundColor: '#dbeafe',
            },
          },
          '&:hover': {
            backgroundColor: '#f1f5f9',
            color: '#0f172a',
            '& .MuiListItemIcon-root': {
              color: '#0f172a',
            },
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.85rem',
        },
      },
    },
  },
});

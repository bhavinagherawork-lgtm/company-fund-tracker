import { createTheme } from '@mui/material/styles';

/**
 * User-Defined Palette Specification:
 * - primary:   #2563EB (Royal Blue / Brand CTA)
 * - secondary: #4D4D4D (Charcoal / Neutral Dark / Subtitles / Inactive)
 * - tertiary:  #E6E6E6 (Light Grey / Structural Borders & Dividers)
 * - neutral:   #FFFFFF (White Document Base)
 * - surface:   #FFFFFF (Pure White Cards & Containers)
 *
 * Geometric Corner Radii (ReUI Component System):
 * - Pill Controls: 9999px
 * - Soft Cards: 16px
 * - Modals / Dialogs: 24px
 *
 * Typography:
 * - Headings: Space Grotesk, sans-serif
 * - Body: Inter, sans-serif
 * - Numbers / Monospace: Space Mono, monospace
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // User Defined Primary
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4d4d4d', // User Defined Secondary
      light: '#666666',
      dark: '#333333',
      contrastText: '#ffffff',
    },
    success: {
      main: '#16a34a', // Inflows / Positive Balance
      light: '#4ade80',
      dark: '#15803d',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626', // Outflows / Deductions
      light: '#f87171',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#d97706',
      light: '#fbbf24',
      dark: '#b45309',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff', // User Defined Neutral
      paper: '#ffffff',   // User Defined Surface
    },
    text: {
      primary: '#1a1a1a',   // High Contrast Body/Headers
      secondary: '#4d4d4d', // User Defined Secondary
    },
    divider: '#e6e6e6',     // User Defined Tertiary
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
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      color: '#1a1a1a',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#1a1a1a',
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#1a1a1a',
    },
    h4: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1.4rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: '#1a1a1a',
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1.18rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: '#1a1a1a',
    },
    h6: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '0.98rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#1a1a1a',
    },
    subtitle1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '0.92rem',
      fontWeight: 600,
      color: '#1a1a1a',
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontSize: '0.84rem',
      fontWeight: 600,
      color: '#4d4d4d',
    },
    body1: {
      fontSize: '14.5px',
      lineHeight: 1.5,
      color: '#1a1a1a',
    },
    body2: {
      fontSize: '13px',
      lineHeight: 1.45,
      color: '#4d4d4d',
    },
    caption: {
      fontSize: '12px',
      lineHeight: 1.4,
      color: '#4d4d4d',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.8125rem',
      fontFamily: 'Inter, sans-serif',
    },
  },
  shape: {
    borderRadius: 16, // --radius-soft-card: 16px
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'small',
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 9999, // --radius-pill-button: 9999px
          boxShadow: 'none',
          padding: '6px 16px',
          fontWeight: 600,
          fontSize: '0.8125rem',
          transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
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
          backgroundColor: '#4d4d4d',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
        containedSuccess: {
          backgroundColor: '#16a34a',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#15803d',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
          },
        },
        outlined: {
          borderColor: '#e6e6e6',
          color: '#1a1a1a',
          backgroundColor: '#ffffff',
          '&:hover': {
            borderColor: '#2563eb',
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16, // --radius-soft-card: 16px
          border: '1px solid #e6e6e6',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'box-shadow 270ms cubic-bezier(0.16, 1, 0.3, 1), border-color 270ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
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
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24, // --radius-modal-overlay: 24px
          border: '1px solid #e6e6e6',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          height: 24,
          fontSize: '0.74rem',
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontSize: '0.84rem',
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e6e6e6',
            transition: 'border-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#a3a3a3',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2563eb',
            borderWidth: 1.5,
          },
        },
        input: {
          padding: '9px 16px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f9fafb',
          fontWeight: 700,
          color: '#4d4d4d',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '10px 14px',
          borderBottom: '1px solid #e6e6e6',
          fontFamily: 'Inter, sans-serif',
        },
        root: {
          padding: '10px 14px',
          fontSize: '0.84rem',
          borderBottom: '1px solid #e6e6e6',
          color: '#1a1a1a',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#2563eb',
          height: 2.5,
          borderRadius: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.84rem',
          color: '#4d4d4d',
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
          borderRadius: 9999,
          color: '#4d4d4d',
          transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          '& .MuiListItemIcon-root': {
            color: '#4d4d4d',
            transition: 'color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          },
          '&.Mui-selected': {
            backgroundColor: '#2563eb !important',
            color: '#ffffff !important',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
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
            '&:hover': {
              backgroundColor: '#1d4ed8 !important',
              color: '#ffffff !important',
            },
          },
          '&:hover': {
            backgroundColor: '#f3f4f6',
            color: '#1a1a1a',
            '& .MuiListItemIcon-root': {
              color: '#2563eb',
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

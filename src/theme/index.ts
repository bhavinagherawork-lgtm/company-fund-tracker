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
      fontSize: '1.2rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: '#1a1a1a',
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1.05rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: '#1a1a1a',
    },
    h6: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '0.88rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#1a1a1a',
    },
    subtitle1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '0.84rem',
      fontWeight: 600,
      color: '#1a1a1a',
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontSize: '0.76rem',
      fontWeight: 600,
      color: '#4d4d4d',
    },
    body1: {
      fontSize: '13.5px',
      lineHeight: 1.45,
      color: '#1a1a1a',
    },
    body2: {
      fontSize: '12px',
      lineHeight: 1.4,
      color: '#4d4d4d',
    },
    caption: {
      fontSize: '11px',
      lineHeight: 1.35,
      color: '#4d4d4d',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.75rem',
      fontFamily: 'Inter, sans-serif',
    },
  },
  shape: {
    borderRadius: 12, // Compact radius: 12px
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'small',
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 9999,
          boxShadow: 'none',
          padding: '4px 12px',
          fontWeight: 600,
          fontSize: '0.75rem',
          minHeight: 28,
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
          borderRadius: 12,
          border: '1px solid #e6e6e6',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
          transition: 'box-shadow 270ms cubic-bezier(0.16, 1, 0.3, 1), border-color 270ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '10px 14px',
          '&:last-child': {
            paddingBottom: '10px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: '1px solid #e6e6e6',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          height: 20,
          fontSize: '0.68rem',
          fontWeight: 600,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.78rem',
          color: '#4d4d4d',
          '&.Mui-focused': {
            color: '#2563eb',
          },
        },
        asterisk: {
          color: '#ef4444 !important',
          fontWeight: 700,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.78rem',
          color: '#4d4d4d',
          '&.Mui-focused': {
            color: '#2563eb',
          },
        },
        asterisk: {
          color: '#ef4444 !important',
          fontWeight: 700,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.7rem',
          marginTop: '2px',
          marginLeft: '4px',
          '&.Mui-error': {
            color: '#ef4444',
            fontWeight: 500,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontSize: '0.78rem',
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
          padding: '6px 12px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f9fafb',
          fontWeight: 700,
          color: '#4d4d4d',
          fontSize: '0.68rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '6px 10px',
          borderBottom: '1px solid #e6e6e6',
          fontFamily: 'Inter, sans-serif',
        },
        root: {
          padding: '6px 10px',
          fontSize: '0.78rem',
          borderBottom: '1px solid #e6e6e6',
          color: '#1a1a1a',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 30,
        },
        indicator: {
          backgroundColor: '#2563eb',
          height: 2,
          borderRadius: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 30,
          padding: '4px 10px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.76rem',
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
          paddingTop: 4,
          paddingBottom: 4,
          minHeight: 32,
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
          fontSize: '0.8rem',
        },
      },
    },
  },
});

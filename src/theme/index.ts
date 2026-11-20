import { createTheme } from '@mui/material/styles';

/**
 * ReUI Design System Specification (from DESIGN.md)
 * Designed strictly according to https://reui.io design tokens:
 * - Primary CTA / Brand: Obsidian #18181b
 * - Focus / Active State: ReUI Gold #eab308
 * - Canvas Background: #fafafa (Document Base)
 * - Surface Container: Pure White #ffffff
 * - Structural Border: #e4e4e7
 * - High-Contrast Text: #09090b
 * - Muted Typography: #71717a
 * - Status Accent (Inflow/Validation): #22c55e
 * - Danger Accent (Outflow/Expenses): #ef4444
 *
 * Geometric Corner Radii:
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
      main: '#18181b', // Obsidian Primary CTA / Brand
      light: '#27272a',
      dark: '#09090b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#eab308', // ReUI Gold / Focus / Active State
      light: '#facc15',
      dark: '#ca8a04',
      contrastText: '#09090b',
    },
    success: {
      main: '#22c55e', // Status Accent / Inflows
      light: '#4ade80',
      dark: '#16a34a',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // Danger / Outflows
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#eab308', // ReUI Warning
      light: '#facc15',
      dark: '#ca8a04',
      contrastText: '#09090b',
    },
    background: {
      default: '#fafafa', // Canvas Base
      paper: '#ffffff', // Surface Container
    },
    text: {
      primary: '#09090b', // High Contrast Text
      secondary: '#71717a', // Muted Typography
    },
    divider: '#e4e4e7', // Structural Border
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
      color: '#09090b',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#09090b',
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#09090b',
    },
    h4: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1.4rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: '#09090b',
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1.18rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: '#09090b',
    },
    h6: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '0.98rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#09090b',
    },
    subtitle1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '0.92rem',
      fontWeight: 600,
      color: '#09090b',
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontSize: '0.84rem',
      fontWeight: 600,
      color: '#71717a',
    },
    body1: {
      fontSize: '14.5px',
      lineHeight: 1.5,
      color: '#09090b',
    },
    body2: {
      fontSize: '13px',
      lineHeight: 1.45,
      color: '#71717a',
    },
    caption: {
      fontSize: '12px',
      lineHeight: 1.4,
      color: '#71717a',
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
          backgroundColor: '#18181b',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#27272a',
            boxShadow: '0 4px 12px rgba(24, 24, 27, 0.2)',
          },
        },
        containedSecondary: {
          backgroundColor: '#eab308',
          color: '#09090b',
          '&:hover': {
            backgroundColor: '#ca8a04',
          },
        },
        containedSuccess: {
          backgroundColor: '#22c55e',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#16a34a',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)',
          },
        },
        outlined: {
          borderColor: '#e4e4e7',
          color: '#09090b',
          backgroundColor: '#ffffff',
          '&:hover': {
            borderColor: '#18181b',
            backgroundColor: '#fafafa',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16, // --radius-soft-card: 16px
          border: '1px solid #e4e4e7',
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
          border: '1px solid #e4e4e7',
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
            borderColor: '#e4e4e7',
            transition: 'border-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#a1a1aa',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#18181b',
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
          backgroundColor: '#fafafa',
          fontWeight: 700,
          color: '#71717a',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '10px 14px',
          borderBottom: '1px solid #e4e4e7',
          fontFamily: 'Inter, sans-serif',
        },
        root: {
          padding: '10px 14px',
          fontSize: '0.84rem',
          borderBottom: '1px solid #e4e4e7',
          color: '#09090b',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#18181b',
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
          color: '#71717a',
          '&.Mui-selected': {
            color: '#18181b',
            fontWeight: 700,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          color: '#71717a',
          transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          '& .MuiListItemIcon-root': {
            color: '#71717a',
            transition: 'color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          },
          '&.Mui-selected': {
            backgroundColor: '#18181b !important',
            color: '#ffffff !important',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
            '& .MuiTypography-root': {
              color: '#ffffff !important',
              fontWeight: 600,
            },
            '& .MuiListItemText-primary': {
              color: '#ffffff !important',
              fontWeight: 600,
            },
            '& .MuiListItemIcon-root': {
              color: '#eab308 !important', // ReUI Gold Highlight for active icon!
            },
            '&:hover': {
              backgroundColor: '#27272a !important',
              color: '#ffffff !important',
            },
          },
          '&:hover': {
            backgroundColor: '#f4f4f5',
            color: '#09090b',
            '& .MuiListItemIcon-root': {
              color: '#09090b',
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

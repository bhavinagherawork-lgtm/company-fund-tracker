import { createTheme } from '@mui/material/styles';

/**
 * Reui Design System Theme Specification (DESIGN.md)
 * - Brand & Primary CTA: Obsidian #18181B
 * - Accent / Active State: Warm Gold #EAB308
 * - Document Canvas: #FAFAFA
 * - Surface Container: #FFFFFF
 * - Structural Border: #E4E4E7
 * - High-Contrast Text: #09090B
 * - Muted Typography: #71717A
 * - Inflow & Active Status: #22C55E
 * - Outflow & Danger: #EF4444
 * 
 * Typographic Hierarchy:
 * - Headings: Space Grotesk
 * - Body / Interface: Inter
 * - Monospace / Currency: Space Mono
 * 
 * Corner Radii:
 * - Pill Buttons & Controls: 9999px
 * - Soft Cards & Panels: 16px
 * - Modal Overlays: 24px
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#18181b', // --obsidian-gold-primary
      light: '#27272a',
      dark: '#09090b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#eab308', // --accent-highlight
      light: '#fde047',
      dark: '#ca8a04',
      contrastText: '#18181b',
    },
    success: {
      main: '#22c55e', // --status-accent
      light: '#4ade80',
      dark: '#16a34a',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // --danger-accent
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#18181b',
    },
    background: {
      default: '#fafafa', // --canvas-base
      paper: '#ffffff', // --surface-container
    },
    text: {
      primary: '#09090b', // --high-contrast-text
      secondary: '#71717a', // --muted-typography
    },
    divider: '#e4e4e7', // --structural-border
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
      letterSpacing: '-0.03em',
      color: '#09090b',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.025em',
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
      fontSize: '1.45rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#09090b',
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1.2rem',
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
      fontSize: '15px',
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
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'small',
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 9999, // --radius-pill-button
          boxShadow: 'none',
          padding: '6px 16px',
          fontWeight: 600,
          fontSize: '0.8125rem',
          transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(24, 24, 27, 0.08)',
          },
        },
        containedPrimary: {
          backgroundColor: '#18181b',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#27272a',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(24, 24, 27, 0.16)',
          },
        },
        containedSecondary: {
          backgroundColor: '#eab308',
          color: '#18181b',
          fontWeight: 700,
          '&:hover': {
            backgroundColor: '#ca8a04',
            color: '#ffffff',
          },
        },
        containedSuccess: {
          backgroundColor: '#22c55e',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#16a34a',
          },
        },
        outlined: {
          borderColor: '#e4e4e7',
          color: '#09090b',
          '&:hover': {
            borderColor: '#18181b',
            backgroundColor: '#f4f4f5',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16, // --radius-soft-card
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
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24, // --radius-modal-overlay
          border: '1px solid #e4e4e7',
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.18)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // --radius-pill-button
          height: 26,
          fontSize: '0.74rem',
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Pill shape for standard inputs
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
          letterSpacing: '0.05em',
          padding: '9px 14px',
          borderBottom: '1px solid #e4e4e7',
          fontFamily: 'Inter, sans-serif',
        },
        root: {
          padding: '9px 14px',
          fontSize: '0.84rem',
          borderBottom: '1px solid #e4e4e7',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#18181b',
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
          fontFamily: '"Space Grotesk", sans-serif',
          color: '#71717a',
          '&.Mui-selected': {
            color: '#18181b',
            fontWeight: 700,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.78rem',
          borderColor: '#e4e4e7',
          padding: '5px 14px',
          '&.Mui-selected': {
            backgroundColor: '#18181b !important',
            color: '#ffffff !important',
            borderColor: '#18181b !important',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: '#18181b',
            color: '#ffffff',
            '& .MuiTypography-root': {
              color: '#ffffff',
            },
            '& .MuiListItemText-primary': {
              color: '#ffffff',
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

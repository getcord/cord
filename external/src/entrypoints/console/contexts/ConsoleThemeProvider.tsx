import type { ReactNode } from 'react';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    monospace: React.CSSProperties;
    monospaceTableCell: React.CSSProperties;
    monospaceCode: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    monospace?: React.CSSProperties;
    monospaceTableCell: React.CSSProperties;
    monospaceCode: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    monospace: true;
    monospaceTableCell: true;
    monospaceCode: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    alert: true;
    basic: true;
  }
}

const monospaceFontFamily = [
  "'SF Mono'",
  'Menlo',
  'Monaco',
  'Consolas',
  "'Liberation Mono'",
  "'Courier New'",
  'monospace',
].join(',');

export function ConsoleThemeProvider({ children }: { children: ReactNode }) {
  const theme = createTheme({
    spacing: SPACING_BASE,
    palette: {
      primary: {
        main: Colors.BRAND_PURPLE_DARK,
      },
      secondary: {
        main: Colors.GREY_X_LIGHT,
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        "'Segoe UI'",
        'Roboto',
        'Helvetica',
        'Arial',
        'sans-serif',
        "'Apple Color Emoji'",
        "'Segoe UI Emoji'",
        "'Segoe UI Symbol'",
      ].join(','),
      h1: {
        fontFamily: 'FavoritWeb',
        fontSize: 32,
        textTransform: 'uppercase',
        letterSpacing: -1,
      },
      h3: {
        fontSize: 16,
        fontWeight: 700,
      },
      body2: {
        fontSize: 14,
      },
      caption: { color: Colors.GREY_DARK, fontSize: 12 },
      button: { textTransform: 'none', fontSize: 16 },
      monospace: {
        fontFamily: monospaceFontFamily,
        fontSize: 15,
      },
      monospaceTableCell: {
        fontFamily: monospaceFontFamily,
        fontSize: Sizes.SMALL_TEXT_SIZE_PX,
        color: '#696A6C',
      },
      monospaceCode: {
        fontFamily: monospaceFontFamily,
        fontSize: Sizes.SMALL_TEXT_SIZE_PX,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
            @font-face {
              font-family: 'FavoritWeb';
              src: url('/static/fonts/Favorit-MonoBeta.woff2') format('woff2'),
                url('/static/fonts/Favorit-MonoBeta.woff') format('woff');
              font-weight: 100;
              font-style: normal;
            }
            
            @font-face {
              font-family: 'FavoritWeb';
              src: url('/static/fonts/Favorit-Regular.woff2') format('woff2'),
                url('/static/fonts/Favorit-Regular.woff') format('woff');
              font-weight: 400;
              font-style: normal;
            }
            
            @font-face {
              font-family: 'FavoritWeb';
              src: url('/static/fonts/Favorit-Bold.woff2') format('woff2'),
                url('/static/fonts/Favorit-Bold.woff') format('woff');
              font-weight: bold;
              font-style: normal;
            }
            
            @font-face {
              font-family: 'abc_favoritbook';
              src: url('/static/fonts/abcfavorit-book-webfont.woff2') format('woff2'),
                url('/static/fonts/abcfavorit-book-webfont.woff') format('woff');
              font-weight: normal;
              font-style: normal;
            }
            `,
      },
      MuiButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: Colors.BRAND_PURPLE_DARKER,
              color: Colors.WHITE,
              boxShadow: 'none',
            },
            '&:focus': {
              outlineColor: Colors.BRAND_PURPLE_DARKER,
              boxShadow: 'none',
            },
            '&:active': {
              boxShadow: 'none',
            },
            boxShadow: 'none',
          },
        },
        variants: [
          {
            props: { variant: 'alert' },
            style: {
              backgroundColor: Colors.ALERT,
              color: Colors.WHITE,
              '&:hover': {
                backgroundColor: Colors.ALERT,
                opacity: 0.6,
                color: Colors.WHITE,
              },
            },
          },
          {
            props: { variant: 'basic' },
            style: {
              backgroundColor: Colors.GREY_X_LIGHT,
              '&:hover': {
                backgroundColor: Colors.GREY_LIGHT,
                color: Colors.BRAND_PRIMARY,
              },
              '&:focus': {
                outlineColor: Colors.GREY_DARK,
              },
            },
          },
        ],
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            transform: 'none',
            position: 'relative',
            fontWeight: 500,
            fontSize: '12px',
            marginBottom: `${Sizes.SMALL}px`,
          },
        },
      },
      MuiTypography: {
        defaultProps: {
          variantMapping: {
            monospace: 'span',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: Sizes.DEFAULT_PADDING_PX,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            '&:not(.Mui-error) > fieldset': {
              borderColor: Colors.GREY_LIGHT,
            },
            '&:hover': {
              '&:not(.Mui-error, .Mui-disabled) > fieldset': {
                borderColor: Colors.BRAND_PURPLE_DARK,
              },
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            border: 'none',
            backgroundColor: Colors.GREY_LIGHT,
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            '& .MuiTablePagination-actions': {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: `${Sizes.MEDIUM}px`,
            },
            '& .MuiTablePagination-displayedRows::before': {
              fontWeight: 'normal',
              content: '"Showing "',
            },
            '& .MuiTablePagination-displayedRows': {
              fontWeight: 'bold',
              margin: 0,
            },
            '& .MuiTablePagination-actions button': {
              backgroundColor: Colors.GREY_X_LIGHT,
              borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
              '&:hover': {
                backgroundColor: Colors.BRAND_PURPLE_DARKER,
                color: Colors.WHITE,
              },
              '&:focus': {
                outline: `5px auto ${Colors.BRAND_PURPLE_DARKER}`,
              },
            },
          },
        },
      },
    },
  });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

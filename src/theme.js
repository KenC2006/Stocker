import { extendTheme } from "@chakra-ui/react";

const colors = {
  uoft: {
    navy: "#002A5C", // UofT Navy Blue
    lightBlue: "#007FA3",
    gold: "#FFE498",
    white: "#FFFFFF",
    gray: {
      50: "#F7FAFC",
      100: "#EDF2F7",
      200: "#E2E8F0",
      300: "#CBD5E0",
      400: "#A0AEC0",
      500: "#718096",
      600: "#4A5568",
      700: "#2D3748",
      800: "#1A202C",
      900: "#171923",
    },
  },
};

const theme = extendTheme({
  colors: {
    ...colors,
    brand: {
      50: "#ebf8ff",
      100: "#bee3f8",
      200: "#90cdf4",
      300: "#63b3ed",
      400: "#4299e1",
      500: "#3182ce",
      600: "#2b6cb0",
      700: "#2c5282",
      800: "#2a4365",
      900: "#1A365D",
    },
  },
  styles: {
    global: {
      body: {
        bgGradient: {
          base: "linear(to-r, blue.100, blue.300)",
          _dark: "linear(to-r, blue.700, blue.900)",
        },
      },
    },
  },
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
    mono: "Inter, Menlo, monospace",
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "blue",
      },
      variants: {
        solid: {
          bg: "blue.500",
          color: "white",
          _hover: {
            bg: "blue.600",
          },
          _dark: {
            bg: "blue.700",
            color: "white",
            _hover: {
              bg: "blue.800",
              color: "white",
            },
          },
        },
        outline: {
          borderColor: "blue.500",
          color: "blue.500",
          _hover: {
            bg: "blue.500",
            color: "white",
          },
          _dark: {
            borderColor: "blue.300",
            color: "blue.300",
            _hover: {
              bg: "blue.700",
              color: "white",
            },
          },
        },
      },
    },
    Tab: {
      baseStyle: {
        _selected: {
          bg: "blue.200",
          color: "blue.900",
          fontWeight: "bold",
        },
        _dark: {
          _selected: {
            bg: "blue.700",
            color: "white",
            fontWeight: "bold",
            boxShadow: "0 0 0 2px #3182ce",
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        color: "blue.900",
        _dark: {
          color: "white",
        },
      },
    },
  },
});

export default theme;

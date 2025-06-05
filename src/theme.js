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
  colors,
  styles: {
    global: {
      body: {
        bg: "gray.50",
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "uoft",
      },
      variants: {
        solid: {
          bg: "uoft.navy",
          color: "white",
          _hover: {
            bg: "uoft.lightBlue",
          },
        },
        outline: {
          borderColor: "uoft.navy",
          color: "uoft.navy",
          _hover: {
            bg: "uoft.navy",
            color: "white",
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        color: "uoft.navy",
      },
    },
  },
});

export default theme;

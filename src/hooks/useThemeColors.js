import { useColorModeValue } from "@chakra-ui/react";

export const useThemeColors = () => ({
  bgColor: useColorModeValue("gray.50", "gray.900"),
  pageBgColor: useColorModeValue("gray.50", "gray.900"),
  cardBg: useColorModeValue("white", "gray.800"),
  cardBgColor: useColorModeValue("white", "gray.800"),
  modalBg: useColorModeValue("white", "gray.800"),

  textColor: useColorModeValue("gray.800", "white"),
  mainTextColor: useColorModeValue("uoft.navy", "white"),
  subTextColor: useColorModeValue("gray.600", "gray.200"),
  subtitleColor: useColorModeValue("gray.600", "gray.300"),
  labelColor: useColorModeValue("gray.700", "gray.200"),
  menuItemTextColor: useColorModeValue("gray.700", "gray.200"),

  borderColor: useColorModeValue("gray.200", "gray.700"),
  navBorder: useColorModeValue("gray.200", "gray.700"),
  modalBorder: useColorModeValue("gray.200", "gray.600"),
  formInputBorder: useColorModeValue("gray.200", "gray.700"),
  formInputHoverBorder: useColorModeValue("blue.400", "blue.400"),
  formInputFocusBorder: useColorModeValue("blue.400", "blue.400"),

  inputBg: useColorModeValue("gray.50", "gray.700"),
  inputColor: useColorModeValue("gray.800", "white"),
  inputFocusBg: useColorModeValue("white", "gray.600"),
  placeholderColor: useColorModeValue("gray.500", "gray.400"),
  formInputBg: useColorModeValue("white", "gray.600"),
  numberInputBg: useColorModeValue("gray.100", "gray.700"),

  accentColor: useColorModeValue("blue.500", "blue.300"),
  iconColor: useColorModeValue("gray.500", "gray.300"),
  errorColor: useColorModeValue("red.500", "red.300"),

  navBg: useColorModeValue("rgba(255,255,255,0.85)", "rgba(26,32,44,0.85)"),
  navTextColor: useColorModeValue("uoft.navy", "white"),
  navButtonBg: useColorModeValue(
    "linear(to-r, blue.400, blue.600)",
    "linear(to-r, blue.700, blue.900)"
  ),
  navButtonHover: useColorModeValue("blue.600", "blue.400"),

  cardShadow: useColorModeValue("lg", "dark-lg"),
  navShadow: useColorModeValue("lg", "dark-lg"),

  gradientStart: useColorModeValue("blue.400", "blue.500"),
  gradientEnd: useColorModeValue("blue.500", "blue.600"),
  balanceGradient: useColorModeValue(
    "linear(to-r, green.400, green.500)",
    "linear(to-r, green.500, green.600)"
  ),
  portfolioGradient: useColorModeValue(
    "linear(to-r, blue.400, blue.500)",
    "linear(to-r, blue.500, blue.600)"
  ),

  guestAlertBg: useColorModeValue("blue.50", "blue.900"),
  guestAlertBorder: useColorModeValue("blue.200", "blue.700"),

  headerBgColor: useColorModeValue("gray.50", "gray.700"),
  rowHoverBg: useColorModeValue("gray.50", "gray.700"),

  timerGradient: useColorModeValue(
    "linear(to-r, blue.100, blue.300)",
    "linear(to-r, blue.700, blue.900)"
  ),
  timerNumberColor: useColorModeValue("blue.800", "white"),
  timerLabelColor: useColorModeValue("uoft.navy", "white"),
  timerSubColor: useColorModeValue("gray.600", "gray.200"),

  stockHeaderBg: useColorModeValue("gray.50", "gray.700"),
  tradingControlsBg: useColorModeValue("gray.50", "gray.700"),

  emailBg: useColorModeValue("gray.100", "gray.700"),

  formInputFocusShadow: "0 0 0 1px var(--chakra-colors-blue-400)",

  bioTextBg: useColorModeValue("white", "gray.600"),

  hoverBorderColor: useColorModeValue("blue.400", "blue.300"),
  cardHoverBg: useColorModeValue("gray.50", "gray.700"),

  progressBg: useColorModeValue("gray.100", "gray.600"),

  prizeCardBg: useColorModeValue("white", "gray.800"),
  prizeCardBorder: useColorModeValue("purple.200", "purple.600"),
  prizeTextColor: useColorModeValue("purple.600", "purple.300"),

  ruleItemBg: useColorModeValue("whiteAlpha.200", "whiteAlpha.100"),
  ruleBulletBg: useColorModeValue("blue.200", "blue.300"),
  keyRulesBg: useColorModeValue("blue.600", "uoft.navy"),
  keyRulesTextColor: useColorModeValue("white", "white"),

  tickerBg: useColorModeValue(
    "linear(to-r, blue.50, blue.100)",
    "linear(to-r, blue.900, blue.800)"
  ),
  tickerBorder: useColorModeValue(
    "linear(to-r, blue.200, blue.300)",
    "linear(to-r, blue.700, blue.600)"
  ),

  chartOpacity: useColorModeValue("0.1", "0.05"),
  chartBg: useColorModeValue(
    "linear(to-r, blue.400, blue.500)",
    "linear(to-r, blue.600, blue.700)"
  ),
});

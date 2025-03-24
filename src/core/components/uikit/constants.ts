/** Common constants for UIKit components */
export const UIKIT_CONSTANTS = {
  /** Color palette */
  COLORS: {
    /** Background colors */
    BACKGROUND: {
      PRIMARY: '#000000',
      SECONDARY: '#111111',
      TERTIARY: '#222222',
    },
    /** Text colors */
    TEXT: {
      PRIMARY: '#FFFFFF',
      SECONDARY: '#CCCCCC',
      DISABLED: '#666666',
    },
    /** Action colors */
    ACTION: {
      PRIMARY: '#2196F3',
      SUCCESS: '#4CAF50',
      WARNING: '#FFC107',
      DANGER: '#F44336',
      INFO: '#00BCD4',
    },
    /** Border colors */
    BORDER: {
      DEFAULT: '#333333',
      HOVER: '#444444',
      FOCUS: '#555555',
    },
  },
  /** Typography settings */
  TYPOGRAPHY: {
    /** Font sizes */
    FONT_SIZE: {
      XS: 12,
      SM: 14,
      MD: 16,
      LG: 18,
      XL: 20,
      XXL: 24,
      XXXL: 32,
    },
    /** Font weights */
    FONT_WEIGHT: {
      LIGHT: 300,
      REGULAR: 400,
      MEDIUM: 500,
      BOLD: 700,
    },
    /** Line heights */
    LINE_HEIGHT: {
      TIGHT: 1.2,
      NORMAL: 1.5,
      LOOSE: 1.8,
    },
  },
  /** Layout settings */
  LAYOUT: {
    /** Spacing values */
    SPACING: {
      XS: 4,
      SM: 8,
      MD: 16,
      LG: 24,
      XL: 32,
    },
    /** Border radius values */
    BORDER_RADIUS: {
      XS: 2,
      SM: 4,
      MD: 8,
      LG: 12,
      XL: 16,
      FULL: 9999,
    },
  },
  /** Animation settings */
  ANIMATION: {
    /** Transition durations */
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
    /** Timing functions */
    EASING: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      LINEAR: 'linear',
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

/** Button component constants */
export const BUTTON_CONSTANTS = {
  /** Button size configurations */
  SIZE: {
    SM: {
      WIDTH: 100,
      HEIGHT: 32,
      PADDING: '0 12px',
      FONT_SIZE: UIKIT_CONSTANTS.TYPOGRAPHY.FONT_SIZE.SM,
    },
    MD: {
      WIDTH: 120,
      HEIGHT: 40,
      PADDING: '0 16px',
      FONT_SIZE: UIKIT_CONSTANTS.TYPOGRAPHY.FONT_SIZE.MD,
    },
    LG: {
      WIDTH: 140,
      HEIGHT: 48,
      PADDING: '0 24px',
      FONT_SIZE: UIKIT_CONSTANTS.TYPOGRAPHY.FONT_SIZE.LG,
    },
    XL: {
      WIDTH: 160,
      HEIGHT: 56,
      PADDING: '0 32px',
      FONT_SIZE: UIKIT_CONSTANTS.TYPOGRAPHY.FONT_SIZE.XL,
    },
  },
  /** Button variant styles */
  VARIANT: {
    DEFAULT: {
      BACKGROUND: UIKIT_CONSTANTS.COLORS.ACTION.PRIMARY,
      HOVER: '#1976D2',
      ACTIVE: '#1565C0',
    },
    CONFIRMED: {
      BACKGROUND: UIKIT_CONSTANTS.COLORS.ACTION.SUCCESS,
      HOVER: '#43A047',
      ACTIVE: '#388E3C',
    },
    DANGER: {
      BACKGROUND: UIKIT_CONSTANTS.COLORS.ACTION.DANGER,
      HOVER: '#D32F2F',
      ACTIVE: '#C62828',
    },
  },
} as const;

/** Card component constants */
export const CARD_CONSTANTS = {
  /** Base card styling */
  STYLE: {
    BACKGROUND: UIKIT_CONSTANTS.COLORS.BACKGROUND.SECONDARY,
    BORDER_RADIUS: UIKIT_CONSTANTS.LAYOUT.BORDER_RADIUS.MD,
    PADDING: UIKIT_CONSTANTS.LAYOUT.SPACING.MD,
    MIN_WIDTH: 280,
  },
  /** Card section styling */
  SECTION: {
    SPACING: UIKIT_CONSTANTS.LAYOUT.SPACING.MD,
    TITLE_SIZE: UIKIT_CONSTANTS.TYPOGRAPHY.FONT_SIZE.MD,
    TITLE_COLOR: UIKIT_CONSTANTS.COLORS.TEXT.SECONDARY,
  },
  /** Card header styling */
  HEADER: {
    SPACING: UIKIT_CONSTANTS.LAYOUT.SPACING.SM,
    TITLE_SIZE: UIKIT_CONSTANTS.TYPOGRAPHY.FONT_SIZE.XL,
    DESCRIPTION_SIZE: UIKIT_CONSTANTS.TYPOGRAPHY.FONT_SIZE.SM,
    DESCRIPTION_COLOR: UIKIT_CONSTANTS.COLORS.TEXT.SECONDARY,
  },
} as const;

/** Radio group component constants */
export const RADIO_GROUP_CONSTANTS = {
  /** Radio button styling */
  RADIO: {
    SIZE: 20,
    BORDER_WIDTH: 2,
    INNER_SIZE: 12,
    SPACING: UIKIT_CONSTANTS.LAYOUT.SPACING.SM,
  },
  /** Radio group styling */
  GROUP: {
    SPACING: UIKIT_CONSTANTS.LAYOUT.SPACING.XS,
    LABEL_SIZE: UIKIT_CONSTANTS.TYPOGRAPHY.FONT_SIZE.MD,
  },
  /** Color settings */
  COLORS: {
    BORDER: UIKIT_CONSTANTS.COLORS.BORDER.DEFAULT,
    CHECKED: UIKIT_CONSTANTS.COLORS.ACTION.PRIMARY,
    HOVER: UIKIT_CONSTANTS.COLORS.BORDER.HOVER,
  },
} as const;

/** Checkbox component constants */
export const CHECKBOX_CONSTANTS = {
  /** Checkbox size and styling */
  STYLE: {
    SIZE: 20,
    BORDER_WIDTH: 2,
    BORDER_RADIUS: UIKIT_CONSTANTS.LAYOUT.BORDER_RADIUS.XS,
    CHECK_ICON_SIZE: 14,
  },
  /** Label styling */
  LABEL: {
    SPACING: UIKIT_CONSTANTS.LAYOUT.SPACING.SM,
    FONT_SIZE: UIKIT_CONSTANTS.TYPOGRAPHY.FONT_SIZE.MD,
  },
  /** Color settings */
  COLORS: {
    BORDER: UIKIT_CONSTANTS.COLORS.BORDER.DEFAULT,
    CHECKED: UIKIT_CONSTANTS.COLORS.ACTION.PRIMARY,
    HOVER: UIKIT_CONSTANTS.COLORS.BORDER.HOVER,
  },
} as const;

/** Progress bar component constants */
export const PROGRESS_CONSTANTS = {
  /** Progress bar styling */
  STYLE: {
    HEIGHT: 8,
    BORDER_RADIUS: UIKIT_CONSTANTS.LAYOUT.BORDER_RADIUS.FULL,
  },
  /** Color settings */
  COLORS: {
    BACKGROUND: UIKIT_CONSTANTS.COLORS.BACKGROUND.TERTIARY,
    FILL: UIKIT_CONSTANTS.COLORS.ACTION.PRIMARY,
  },
  /** Animation settings */
  ANIMATION: {
    DURATION: UIKIT_CONSTANTS.ANIMATION.DURATION.NORMAL,
    EASING: UIKIT_CONSTANTS.ANIMATION.EASING.EASE_OUT,
  },
} as const;

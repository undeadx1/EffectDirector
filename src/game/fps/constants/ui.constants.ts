/** Visual styling constants for the sample game */
export const FPS_UI_CONSTANTS = {
  /** Color palette for the entire sample game UI */
  COLORS: {
    BACKGROUND_PRIMARY: '#000000', // Main background color (darkest)
    BACKGROUND_SECONDARY: '#111111', // Container background color (dark)
    BACKGROUND_TERTIARY: '#222222', // Item background color (lighter)
    TEXT_PRIMARY: '#FFFFFF', // Primary text color
    ACTION_SUCCESS: '#4CAF50', // Success actions (ready, confirmed)
    ACTION_INFO: '#2196F3', // Information actions (buttons)
    ACTION_DANGER: '#FF5252', // Danger actions (not ready, exit)
    ACCENT_GOLD: '#FFD700', // Special highlight color (rankings)
  },
  /** Typography scale and settings */
  TYPOGRAPHY: {
    HEADING_LARGE_SIZE: 48,
    HEADING_MEDIUM_SIZE: 32,
    BODY_DEFAULT_SIZE: 16,
  },
  /** Layout measurements and spacing */
  LAYOUT: {
    COLUMN_WIDTH: 280,
    CONTAINER_WIDTH: 600,
    ITEM_HEIGHT: 40,
    PADDING_HORIZONTAL: 16,
    SPACING_ITEM: 8,
    SPACING_SECTION: 32,
    BORDER_RADIUS_CONTAINER: 8,
    BORDER_RADIUS_ITEM: 4,
    STATUS_INDICATOR_SIZE: 8,
  },

  FONT: {
    MAPLESTORY_BOLD: '/fonts/Maplestory Bold.ttf',
    MAPLESTORY_LIGHT: '/fonts/Maplestory Light.ttf',
  },
} as const;

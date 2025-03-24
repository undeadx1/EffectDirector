import { ContainerRef, Container } from '@react-three/uikit';
import { forwardRef } from 'react';
import { colors } from './Theme';
import { StyledText } from './StyledText';

/** Color configuration for checkbox component */
const COLORS = {
  CHECKBOX: {
    ACTIVE: '#2196F3',
    INACTIVE: '#757575',
  },
  TEXT: {
    PRIMARY: '#FFFFFF',
    SECONDARY: '#FFFF99',
  },
  HOVER: {
    BACKGROUND: colors.accent,
  },
} as const;

/** Size and spacing configuration for checkbox component */
const SIZES = {
  CHECKBOX: {
    OUTER: 20,
    INNER: 12,
    OUTER_RADIUS: 4,
    INNER_RADIUS: 2,
  },
  TEXT: {
    FONT_SIZE: 14,
  },
  SPACING: {
    GAP: 12,
    PADDING: 8,
  },
  BORDER_RADIUS: 8,
} as const;

/** Props for the Checkbox component */
interface CheckboxProps {
  /** Optional label text */
  label?: string;
  /** Current checked state */
  checked: boolean;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Callback function when checkbox state changes */
  onChange: (checked: boolean) => void;
}

/**
 * Checkbox component with customizable label and state
 *
 * @component
 * @example
 * ```tsx
 * <Checkbox
 *   label="Enable feature"
 *   checked={isEnabled}
 *   onChange={setIsEnabled}
 * />
 * ```
 */
export const Checkbox = forwardRef<ContainerRef, CheckboxProps>(
  ({ checked, disabled = false, label, onChange }, ref) => {
    return (
      <Container
        flexDirection="row"
        alignItems="center"
        gap={SIZES.SPACING.GAP}
        padding={SIZES.SPACING.PADDING}
        cursor={disabled ? undefined : 'pointer'}
        borderRadius={SIZES.BORDER_RADIUS}
        hover={
          disabled
            ? undefined
            : {
                backgroundColor: COLORS.HOVER.BACKGROUND,
              }
        }
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
          if (!disabled) {
            onChange(!checked);
          }
        }}
      >
        <Container
          alignItems="center"
          justifyContent="center"
          borderRadius={SIZES.CHECKBOX.OUTER_RADIUS}
          width={SIZES.CHECKBOX.OUTER}
          height={SIZES.CHECKBOX.OUTER}
          borderWidth={1}
          borderColor={COLORS.CHECKBOX.INACTIVE}
          backgroundColor={checked ? COLORS.CHECKBOX.ACTIVE : undefined}
          backgroundOpacity={disabled ? 0.5 : undefined}
          borderOpacity={disabled ? 0.5 : undefined}
          ref={ref}
          pointerEvents="none"
        >
          {checked && (
            <Container
              alignItems="center"
              justifyContent="center"
              width={SIZES.CHECKBOX.INNER}
              height={SIZES.CHECKBOX.INNER}
              pointerEvents="none"
            >
              <StyledText
                color={disabled ? COLORS.TEXT.SECONDARY : COLORS.TEXT.PRIMARY}
                fontSize={SIZES.TEXT.FONT_SIZE}
              >
                V
              </StyledText>
            </Container>
          )}
        </Container>
        {label && (
          <StyledText
            color={disabled ? COLORS.TEXT.SECONDARY : COLORS.TEXT.PRIMARY}
            fontSize={SIZES.TEXT.FONT_SIZE}
          >
            {label}
          </StyledText>
        )}
      </Container>
    );
  }
);

Checkbox.displayName = 'Checkbox';

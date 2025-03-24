import { Container } from '@react-three/uikit';
import { StyledText } from './StyledText';
import { colors } from './Theme';

/** Color configuration for radio group component */
const COLORS = {
  RADIO: {
    ACTIVE: '#2196F3',
    INACTIVE: '#757575',
  },
  TEXT: {
    PRIMARY: '#FFFF99',
    SECONDARY: '#FFFFFF',
  },
  HOVER: {
    BACKGROUND: colors.accent,
  },
} as const;

/** Size and spacing configuration for radio group component */
const SIZES = {
  RADIO: {
    OUTER: 20,
    INNER: 12,
    OUTER_RADIUS: 10,
    INNER_RADIUS: 6,
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

/** Single option in the radio group */
interface RadioOption {
  /** Unique value for the option */
  value: string;
  /** Display text for the option */
  label: string;
}

/** Props for the RadioGroup component */
interface RadioGroupProps {
  /** Array of available options */
  options: RadioOption[];
  /** Currently selected value */
  value: string;
  /** Callback function when selection changes */
  onChange: (value: string) => void;
}

/**
 * Radio group component for selecting a single option from a list
 *
 * @component
 * @example
 * ```tsx
 * <RadioGroup
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' }
 *   ]}
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 * />
 * ```
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <Container flexDirection="column" gap={SIZES.SPACING.GAP}>
      {options.map((option) => (
        <Container
          key={option.value}
          flexDirection="row"
          alignItems="center"
          gap={SIZES.SPACING.GAP}
          padding={SIZES.SPACING.PADDING}
          cursor="pointer"
          borderRadius={SIZES.BORDER_RADIUS}
          hover={{
            backgroundColor: COLORS.HOVER.BACKGROUND,
          }}
          onClick={() => onChange(option.value)}
        >
          <Container
            width={SIZES.RADIO.OUTER}
            height={SIZES.RADIO.OUTER}
            backgroundColor={
              value === option.value
                ? COLORS.RADIO.ACTIVE
                : COLORS.RADIO.INACTIVE
            }
            borderRadius={SIZES.RADIO.OUTER_RADIUS}
            alignItems="center"
            justifyContent="center"
          >
            {value === option.value && (
              <Container
                width={SIZES.RADIO.INNER}
                height={SIZES.RADIO.INNER}
                backgroundColor={COLORS.TEXT.PRIMARY}
                borderRadius={SIZES.RADIO.INNER_RADIUS}
              />
            )}
          </Container>
          <StyledText
            fontSize={SIZES.TEXT.FONT_SIZE}
            color={
              value === option.value
                ? COLORS.TEXT.PRIMARY
                : COLORS.TEXT.SECONDARY
            }
          >
            {option.label}
          </StyledText>
        </Container>
      ))}
    </Container>
  );
};

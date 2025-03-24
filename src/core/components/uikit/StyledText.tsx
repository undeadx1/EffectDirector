import { forwardRef } from 'react';
import { Text, TextProperties } from '@react-three/uikit';

/** Props for the StyledText component */
export interface StyledTextProps extends TextProperties {
  /** Text content */
  children?: React.ReactNode;
  /** Font size in pixels */
  fontSize?: number;
  /** Font weight value */
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  /** Text color */
  color?: string;
  /** 3D position coordinates */
  position?: [number, number, number];
  /** Whether to use custom font */
  useCustomFont?: boolean;
  /** Font family selection */
  fontFamily?: FontFamily;
}

/** Available font families for styled text */
type FontFamily = 'default' | 'DNFBitBitv2' | 'Maple';

/**
 * Enhanced text component with consistent styling and custom font support
 *
 * @component
 * @example
 * ```tsx
 * <StyledText
 *   fontSize={16}
 *   color="white"
 *   fontFamily="Maple"
 * >
 *   Hello World
 * </StyledText>
 * ```
 */
export const StyledText = forwardRef<unknown, StyledTextProps>(
  (
    {
      children,
      fontSize = 16,
      fontWeight = 'normal',
      color = 'white',
      fontFamily = 'Maple',
      ...props
    },
    ref
  ) => {
    return (
      <Text
        ref={ref}
        fontFamily={fontFamily}
        fontStyle="normal"
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        textAlign="center"
        verticalAlign="bottom"
        outlineWidth={0.02}
        outlineColor="#0000FF"
        {...props}
      >
        {children}
      </Text>
    );
  }
);

StyledText.displayName = 'StyledText';

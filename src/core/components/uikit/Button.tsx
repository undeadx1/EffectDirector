import React, { forwardRef } from 'react';
import {
  AllOptionalProperties,
  Container,
  ContainerProperties,
  ContainerRef,
  DefaultProperties,
} from '@react-three/uikit';
import { StyledText } from './StyledText';
import { BUTTON_CONSTANTS, UIKIT_CONSTANTS } from './constants';

/** Button variant configuration type */
type ButtonVariant = {
  /** Hover state properties for the container */
  containerHoverProps?: ContainerProperties['hover'];
  /** Base container properties excluding hover state */
  containerProps?: Omit<ContainerProperties, 'hover'>;
  /** Default text and style properties */
  defaultProps?: AllOptionalProperties;
};

/** Button variant styles configuration */
const buttonVariants: Record<string, ButtonVariant> = {
  /** Default button style */
  default: {
    containerHoverProps: {
      backgroundColor: BUTTON_CONSTANTS.VARIANT.DEFAULT.HOVER,
    },
    containerProps: {
      width: BUTTON_CONSTANTS.SIZE.MD.WIDTH,
      height: BUTTON_CONSTANTS.SIZE.MD.HEIGHT,
      backgroundColor: BUTTON_CONSTANTS.VARIANT.DEFAULT.BACKGROUND,
      borderRadius: UIKIT_CONSTANTS.LAYOUT.BORDER_RADIUS.MD,
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    defaultProps: {
      fontSize: BUTTON_CONSTANTS.SIZE.MD.FONT_SIZE,
      color: UIKIT_CONSTANTS.COLORS.TEXT.PRIMARY,
      pointerEvents: 'none',
      opacity: 1,
    },
  },
  /** Confirmed/Success button style */
  confirmed: {
    containerHoverProps: {
      backgroundColor: BUTTON_CONSTANTS.VARIANT.CONFIRMED.HOVER,
    },
    containerProps: {
      backgroundColor: BUTTON_CONSTANTS.VARIANT.CONFIRMED.BACKGROUND,
    },
    defaultProps: {
      color: UIKIT_CONSTANTS.COLORS.TEXT.PRIMARY,
    },
  },
  /** Danger/Warning button style */
  danger: {
    containerHoverProps: {
      backgroundColor: BUTTON_CONSTANTS.VARIANT.DANGER.HOVER,
    },
    containerProps: {
      backgroundColor: BUTTON_CONSTANTS.VARIANT.DANGER.BACKGROUND,
    },
    defaultProps: {
      color: UIKIT_CONSTANTS.COLORS.TEXT.PRIMARY,
    },
  },
};

/** Button size configurations */
const buttonSizes = {
  /** Small button size */
  sm: {
    width: BUTTON_CONSTANTS.SIZE.SM.WIDTH,
    height: BUTTON_CONSTANTS.SIZE.SM.HEIGHT,
    fontSize: BUTTON_CONSTANTS.SIZE.SM.FONT_SIZE,
    padding: BUTTON_CONSTANTS.SIZE.SM.PADDING,
  },
  /** Medium button size (default) */
  md: {
    width: BUTTON_CONSTANTS.SIZE.MD.WIDTH,
    height: BUTTON_CONSTANTS.SIZE.MD.HEIGHT,
    fontSize: BUTTON_CONSTANTS.SIZE.MD.FONT_SIZE,
    padding: BUTTON_CONSTANTS.SIZE.MD.PADDING,
  },
  /** Large button size */
  lg: {
    width: BUTTON_CONSTANTS.SIZE.LG.WIDTH,
    height: BUTTON_CONSTANTS.SIZE.LG.HEIGHT,
    fontSize: BUTTON_CONSTANTS.SIZE.LG.FONT_SIZE,
    padding: BUTTON_CONSTANTS.SIZE.LG.PADDING,
  },
  /** Extra large button size */
  xl: {
    width: BUTTON_CONSTANTS.SIZE.XL.WIDTH,
    height: BUTTON_CONSTANTS.SIZE.XL.HEIGHT,
    fontSize: BUTTON_CONSTANTS.SIZE.XL.FONT_SIZE,
    padding: BUTTON_CONSTANTS.SIZE.XL.PADDING,
  },
} satisfies { [Key in string]: ContainerProperties };

/** Button component properties */
export interface ButtonProperties extends ContainerProperties {
  /** Button content */
  children?: React.ReactNode;
  /** Button style variant */
  variant?: keyof typeof buttonVariants;
  /** Button size */
  size?: keyof typeof buttonSizes;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Custom hover properties */
  hover?: ContainerProperties['hover'];
  /** Text color */
  color?: string;
  /** Click event handler */
  onClick?: () => void;
}

/**
 * Button component with various sizes and styles
 *
 * @component
 * @example
 * ```tsx
 * <Button size="md" variant="default" onClick={() => console.log('clicked')}>
 *   Click me
 * </Button>
 * ```
 */
function ButtonComponent(
  {
    children,
    variant = 'default',
    size = 'md',
    disabled = false,
    hover,
    ...props
  }: ButtonProperties,
  ref: React.ForwardedRef<ContainerRef>
) {
  const { containerProps, defaultProps, containerHoverProps } =
    buttonVariants[variant];
  const sizeProps = buttonSizes[size];

  return (
    <Container
      borderRadius={UIKIT_CONSTANTS.LAYOUT.BORDER_RADIUS.MD}
      alignItems="center"
      justifyContent="center"
      {...containerProps}
      {...sizeProps}
      borderOpacity={disabled ? 0.5 : undefined}
      backgroundOpacity={disabled ? 0.5 : undefined}
      cursor={disabled ? undefined : 'pointer'}
      flexDirection="row"
      hover={{
        ...containerHoverProps,
        ...hover,
      }}
      ref={ref}
      {...props}
    >
      <DefaultProperties
        fontSize={sizeProps.fontSize}
        lineHeight={UIKIT_CONSTANTS.TYPOGRAPHY.LINE_HEIGHT.NORMAL}
        fontWeight={UIKIT_CONSTANTS.TYPOGRAPHY.FONT_WEIGHT.MEDIUM}
        wordBreak="keep-all"
        {...defaultProps}
        opacity={disabled ? 0.5 : undefined}
      >
        {typeof children === 'string' ? (
          <StyledText
            fontSize={sizeProps.fontSize}
            color={UIKIT_CONSTANTS.COLORS.TEXT.PRIMARY}
          >
            {children}
          </StyledText>
        ) : (
          children
        )}
      </DefaultProperties>
    </Container>
  );
}

ButtonComponent.displayName = 'Button';

export const Button = forwardRef<ContainerRef, ButtonProperties>(
  ButtonComponent
);

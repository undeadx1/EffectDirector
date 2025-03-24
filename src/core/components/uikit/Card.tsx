import {
  ContainerRef,
  Container,
  ContainerProperties,
  DefaultProperties,
} from '@react-three/uikit';
import React, { ReactNode, forwardRef } from 'react';
import { StyledText } from './StyledText';
import { CARD_CONSTANTS, UIKIT_CONSTANTS } from './constants';

/** Base card component properties */
export type CardProperties = ContainerProperties;

/**
 * Card component - A container with standardized styling
 *
 * @component
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description</CardDescription>
 *   </CardHeader>
 *   <CardContent>Content</CardContent>
 * </Card>
 * ```
 */
export const Card = forwardRef<ContainerRef, CardProperties>(
  ({ children, ...props }, ref) => {
    return (
      <Container
        flexDirection="column"
        borderRadius={UIKIT_CONSTANTS.LAYOUT.BORDER_RADIUS.LG}
        borderWidth={1}
        backgroundColor={CARD_CONSTANTS.STYLE.BACKGROUND}
        ref={ref}
        {...props}
      >
        <DefaultProperties color={UIKIT_CONSTANTS.COLORS.TEXT.PRIMARY}>
          {children}
        </DefaultProperties>
      </Container>
    );
  }
);

Card.displayName = 'Card';

/** Card header section properties */
export type CardHeaderProperties = ContainerProperties;

/**
 * Card header component - Contains title and description
 *
 * @component
 */
export const CardHeader = forwardRef<ContainerRef, CardHeaderProperties>(
  (props, ref) => {
    return (
      <Container
        padding={CARD_CONSTANTS.STYLE.PADDING}
        flexDirection="column"
        gap={CARD_CONSTANTS.SECTION.SPACING}
        ref={ref}
        {...props}
      >
        {props.children}
      </Container>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/** Card title properties */
export type CardTitleProperties = { children?: ReactNode };

/**
 * Card title component - Main heading for the card
 *
 * @component
 */
export const CardTitle: React.FC<CardTitleProperties> = (props) => {
  return (
    <StyledText
      fontWeight={UIKIT_CONSTANTS.TYPOGRAPHY.FONT_WEIGHT.BOLD}
      fontSize={CARD_CONSTANTS.HEADER.TITLE_SIZE}
      {...props}
    >
      {props.children}
    </StyledText>
  );
};

CardTitle.displayName = 'CardTitle';

/** Card description properties */
export type CardDescriptionProperties = { children?: ReactNode };

/**
 * Card description component - Supplementary text below the title
 *
 * @component
 */
export const CardDescription: React.FC<CardDescriptionProperties> = (props) => {
  return (
    <StyledText
      fontSize={CARD_CONSTANTS.HEADER.DESCRIPTION_SIZE}
      color={CARD_CONSTANTS.HEADER.DESCRIPTION_COLOR}
      {...props}
    >
      {props.children}
    </StyledText>
  );
};

CardDescription.displayName = 'CardDescription';

/** Card content section properties */
export type CardContentProperties = ContainerProperties;

/**
 * Card content component - Main content area of the card
 *
 * @component
 */
export const CardContent = forwardRef<ContainerRef, CardContentProperties>(
  (props, ref) => {
    return (
      <Container
        padding={CARD_CONSTANTS.STYLE.PADDING}
        paddingTop={0}
        width="100%"
        flexDirection="column"
        alignItems="stretch"
        ref={ref}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

/** Card footer section properties */
export type CardFooterProperties = ContainerProperties;

/**
 * Card footer component - Bottom section of the card
 *
 * @component
 */
export const CardFooter = forwardRef<ContainerRef, CardFooterProperties>(
  (props, ref) => {
    return (
      <Container
        flexDirection="row"
        alignItems="center"
        padding={CARD_CONSTANTS.STYLE.PADDING}
        paddingTop={0}
        ref={ref}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

/** Card section properties */
export type CardSectionProperties = ContainerProperties & {
  /** Optional section title */
  title?: string;
};

/**
 * Card section component - A subdivided area within the card
 *
 * @component
 * @example
 * ```tsx
 * <CardSection title="Section Title">
 *   <div>Section content</div>
 * </CardSection>
 * ```
 */
export const CardSection = forwardRef<ContainerRef, CardSectionProperties>(
  ({ title, children, ...props }, ref) => {
    return (
      <Container
        flexDirection="column"
        gap={CARD_CONSTANTS.SECTION.SPACING}
        width="100%"
        alignItems="stretch"
        ref={ref}
        {...props}
      >
        {title && (
          <Container alignItems="flex-start" width="100%">
            <StyledText
              fontSize={CARD_CONSTANTS.SECTION.TITLE_SIZE}
              color={UIKIT_CONSTANTS.COLORS.TEXT.PRIMARY}
              fontWeight={UIKIT_CONSTANTS.TYPOGRAPHY.FONT_WEIGHT.BOLD}
            >
              {title}
            </StyledText>
          </Container>
        )}
        <Container
          flexDirection="column"
          gap={UIKIT_CONSTANTS.LAYOUT.SPACING.SM}
          padding={CARD_CONSTANTS.STYLE.PADDING}
          borderWidth={1}
          borderColor={UIKIT_CONSTANTS.COLORS.BORDER.DEFAULT}
          borderRadius={UIKIT_CONSTANTS.LAYOUT.BORDER_RADIUS.MD}
          width="100%"
          alignItems="stretch"
        >
          {children}
        </Container>
      </Container>
    );
  }
);

CardSection.displayName = 'CardSection';

import {
  ContainerRef,
  Container,
  ContainerProperties,
} from '@react-three/uikit';
import { forwardRef, useMemo } from 'react';

import { Signal, computed } from '@preact/signals-core';
import { colors } from './Theme';

/** Properties for the Progress component */
export type ProgressProperties = {
  /** Progress value (0-100) as a signal or number */
  value?: Signal<number> | number;
} & Omit<ContainerProperties, 'children'>;

/**
 * Progress bar component that displays a percentage value
 *
 * @component
 * @example
 * ```tsx
 * <Progress value={75} />
 * ```
 */
export const Progress = forwardRef<ContainerRef, ProgressProperties>(
  ({ value, ...props }, ref) => {
    // Compute width percentage string from value
    const width = useMemo(
      () => computed(() => `${(value ?? 0) as number}%` as const),
      [value]
    );

    return (
      <Container
        height={16}
        width="100%"
        borderRadius={1000}
        backgroundColor={colors.secondary}
        ref={ref}
        {...props}
      >
        <Container
          height="100%"
          borderRadius={1000}
          backgroundColor={colors.primary}
          width={width}
        />
      </Container>
    );
  }
);

Progress.displayName = 'Progress';

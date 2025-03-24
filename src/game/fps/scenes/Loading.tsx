import { Suspense } from 'react';
import { Container, Fullscreen, Text } from '@react-three/uikit';
import { useProgress } from '@react-three/drei';
import { UICamera } from '@/game/sample/camera';
import { Defaults, Progress } from '@/core/components';
import ResourcePreloader from '@/core/components/ResourcePreloader';

const LOADING_SCENE_CONSTANTS = {
  LAYOUT: {
    PROGRESS_BAR_WIDTH: 480,
    GAP: {
      SECTIONS: 16,
    },
  },
  TYPOGRAPHY: {
    TITLE_SIZE: 32,
    PROGRESS_TEXT_SIZE: 16,
  },
  COLORS: {
    BACKGROUND: '#000000',
    TEXT: '#FFFFFF',
    PROGRESS_BAR: '#4CAF50',
  },
} as const;

const LoadingScreen = ({ progress }: { progress: number }) => {
  return (
    <group>
      <UICamera />
      <Defaults>
        <Fullscreen
          backgroundColor={LOADING_SCENE_CONSTANTS.COLORS.BACKGROUND}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={LOADING_SCENE_CONSTANTS.LAYOUT.GAP.SECTIONS}
        >
          <Container>
            <Text
              fontSize={LOADING_SCENE_CONSTANTS.TYPOGRAPHY.TITLE_SIZE}
              color={LOADING_SCENE_CONSTANTS.COLORS.TEXT}
            >
              Loading...
            </Text>
          </Container>
          <Progress
            value={progress}
            width={LOADING_SCENE_CONSTANTS.LAYOUT.PROGRESS_BAR_WIDTH}
          />
          <Container>
            <Text
              fontSize={LOADING_SCENE_CONSTANTS.TYPOGRAPHY.PROGRESS_TEXT_SIZE}
              color={LOADING_SCENE_CONSTANTS.COLORS.TEXT}
            >
              {`${Math.round(progress)}%`}
            </Text>
          </Container>
        </Fullscreen>
      </Defaults>
    </group>
  );
};

/**
 * Initial loading scene with progress bar
 * Automatically transitions to lobby scene when loading completes
 *
 * @component
 * @param {LoadingSceneProps} props - Component props
 * @param {boolean} props.visible - Controls scene visibility
 * @param {Function} props.setCurrentScene - Scene transition handler
 */
const Loading = ({ children }: { children: React.ReactNode }) => {
  const { progress } = useProgress();

  return (
    <ResourcePreloader>
      <Suspense fallback={<LoadingScreen progress={progress} />}>
        {children}
      </Suspense>
    </ResourcePreloader>
  );
};

export default Loading;

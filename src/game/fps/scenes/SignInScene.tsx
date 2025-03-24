import { useEffect, useState } from 'react';
import { Container, Fullscreen } from '@react-three/uikit';
import { Input } from '@/core/components/uikit';
import { StyledText } from '@/core/components/uikit/StyledText';
import { Button, Defaults } from '@/core/components';
import { useFpsGameStore } from '@/game/fps/store/fpsGameStore';
import { useFpsGameNetwork } from '@/game/fps/hooks/useFpsGameNetwork';
import { UICamera } from '@/game/fps/camera/UICamera';
import {
  KeyboardControls,
  useKeyboardControls,
  KeyboardControlsEntry,
} from '@react-three/drei';
import { useGameServer } from '@agent8/gameserver';
import { useFpsNetworkStore } from '@/game/fps/store/fpsNetworkStore';

const SIGNIN_SCENE_CONSTANTS = {
  LAYOUT: {
    FORM_WIDTH: 400,
    PADDING: {
      X: 16,
      Y: 8,
    },
    GAP: {
      ITEMS: 16,
      SECTIONS: 32,
    },
    BORDER_RADIUS: {
      CONTAINER: 8,
    },
  },
  TYPOGRAPHY: {
    TITLE_SIZE: 48,
    LABEL_SIZE: 16,
  },
  COLORS: {
    BACKGROUND: '#000000',
    CONTAINER: '#111111',
    TEXT: '#FFFFFF',
    BUTTON_SIGNIN: '#2196F3',
    BUTTON_SIGNIN_HOVER: '#1E88E5',
  },
} as const;

const KEYBOARD_MAP: KeyboardControlsEntry<string>[] = [
  { name: 'submit', keys: ['Enter'] },
];

/**
 * Sign-in scene component
 * Handles user authentication and profile setup
 *
 * @component
 */
const SignInSceneContent = () => {
  const [username, setUsername] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account, verse, connected } = useGameServer();
  const { myState } = useFpsNetworkStore();
  const { updateMyUsername, joinRoom } = useFpsGameNetwork();
  const { setCurrentScene } = useFpsGameStore();
  const pressed = useKeyboardControls((state) => state.submit);

  useEffect(() => {
    if (account && verse && connected) {
      if (myState?.profile?.username) {
        setUsername(myState.profile.username);
      }
    }
  }, [account, verse, connected, myState]);

  const handleSignIn = async () => {
    if (!username.trim()) return;

    setIsSigningIn(true);
    setError(null);

    try {
      await updateMyUsername(username);
      await joinRoom('FpsRoom000');
      setCurrentScene('lobby');
    } catch (error) {
      console.error('Sign in failed:', error);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleInputChange = (value: string) => {
    setUsername(value);
  };

  const canSignIn = connected && !isSigningIn && username.trim() && !error;

  // 엔터 키 이벤트 처리
  useEffect(() => {
    if (pressed && canSignIn) {
      handleSignIn();
    }
  }, [pressed, canSignIn, handleSignIn]);

  return (
    <group>
      <UICamera />
      <Defaults>
        <Fullscreen
          backgroundColor={SIGNIN_SCENE_CONSTANTS.COLORS.BACKGROUND}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={SIGNIN_SCENE_CONSTANTS.LAYOUT.GAP.SECTIONS}
          pointerEvents="all"
        >
          {/* Title */}
          <Container>
            <StyledText
              fontSize={SIGNIN_SCENE_CONSTANTS.TYPOGRAPHY.TITLE_SIZE}
              color={SIGNIN_SCENE_CONSTANTS.COLORS.TEXT}
            >
              Fps Template
            </StyledText>
          </Container>

          {/* Connection Status */}
          <Container
            borderRadius={SIGNIN_SCENE_CONSTANTS.LAYOUT.BORDER_RADIUS.CONTAINER}
            paddingX={SIGNIN_SCENE_CONSTANTS.LAYOUT.PADDING.X}
            paddingY={SIGNIN_SCENE_CONSTANTS.LAYOUT.PADDING.Y}
            flexDirection="row"
            alignItems="center"
            gap={SIGNIN_SCENE_CONSTANTS.LAYOUT.GAP.ITEMS}
            visible={true}
          >
            <StyledText
              fontSize={SIGNIN_SCENE_CONSTANTS.TYPOGRAPHY.LABEL_SIZE}
              color={
                error
                  ? '#ff4444'
                  : connected
                    ? '#44ff44'
                    : SIGNIN_SCENE_CONSTANTS.COLORS.TEXT
              }
            >
              {!connected
                ? 'Connecting to server...'
                : error
                  ? error
                  : 'Connected to server'}
            </StyledText>
          </Container>

          {/* Sign In Form */}
          <Container
            width={SIGNIN_SCENE_CONSTANTS.LAYOUT.FORM_WIDTH}
            backgroundColor={SIGNIN_SCENE_CONSTANTS.COLORS.CONTAINER}
            borderRadius={SIGNIN_SCENE_CONSTANTS.LAYOUT.BORDER_RADIUS.CONTAINER}
            paddingX={SIGNIN_SCENE_CONSTANTS.LAYOUT.PADDING.X}
            paddingY={SIGNIN_SCENE_CONSTANTS.LAYOUT.PADDING.Y}
            flexDirection="column"
            gap={SIGNIN_SCENE_CONSTANTS.LAYOUT.GAP.ITEMS}
            pointerEvents="all"
          >
            <Container alignItems="flex-start" width="100%">
              <StyledText
                fontSize={SIGNIN_SCENE_CONSTANTS.TYPOGRAPHY.LABEL_SIZE}
                color={SIGNIN_SCENE_CONSTANTS.COLORS.TEXT}
              >
                Username
              </StyledText>
            </Container>
            <Input
              value={username}
              onValueChange={handleInputChange}
              placeholder="Enter your username"
              type="text"
              disabled={!connected || isSigningIn || error !== null}
            />
          </Container>

          {/* Sign In Button */}
          <Container pointerEvents="all">
            <Button
              variant="default"
              size="xl"
              onClick={handleSignIn}
              disabled={!canSignIn}
            >
              {isSigningIn ? 'Signing in...' : 'Sign in'}
            </Button>
          </Container>
        </Fullscreen>
      </Defaults>
    </group>
  );
};

const SignInScene = () => {
  return (
    <KeyboardControls map={KEYBOARD_MAP}>
      <SignInSceneContent />
    </KeyboardControls>
  );
};

export default SignInScene;

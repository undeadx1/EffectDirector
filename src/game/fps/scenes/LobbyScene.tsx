import { Container, Fullscreen } from '@react-three/uikit';
import { Button } from '@/core/components';
import { StyledText } from '@/core/components/uikit/StyledText';
import { UICamera } from '@/game/fps/camera/UICamera';
import { useEffect, useMemo, useState } from 'react';
import { useFpsGameNetwork } from '@/game/fps/hooks/useFpsGameNetwork';
import { useFpsGameStore } from '@/game/fps/store/fpsGameStore';
import { useFpsNetworkStore } from '@/game/fps/store/fpsNetworkStore';

const LOBBY_SCENE_CONSTANTS = {
  LAYOUT: {
    PLAYER_COLUMN_WIDTH: 280,
    PLAYER_LIST_WIDTH: 600,
    PLAYER_ITEM_HEIGHT: 40,
    PADDING_X: 16,
    GAP: {
      COLUMN_ITEMS: 8,
      SECTIONS: 32,
    },
    BORDER_RADIUS: {
      CONTAINER: 8,
      ITEM: 4,
      STATUS_INDICATOR: 4,
    },
    STATUS_INDICATOR: {
      SIZE: 8,
    },
  },
  TYPOGRAPHY: {
    TITLE_SIZE: 48,
    PLAYER_NAME_SIZE: 16,
  },
  COLORS: {
    BACKGROUND: '#000000',
    CONTAINER: '#111111',
    PLAYER_ITEM: '#222222',
    TEXT: '#FFFFFF',
    READY_ON: '#4CAF50',
    READY_OFF: '#FF5252',
    BUTTON_READY: '#2196F3',
    BUTTON_READY_HOVER: '#1E88E5',
    BUTTON_CONFIRMED: '#4CAF50',
    BUTTON_CONFIRMED_HOVER: '#45A049',
  },
  GAME_RULES: {
    MAX_PLAYERS: 16,
    PLAYERS_PER_COLUMN: 8,
  },
} as const;

interface LobbyPlayer {
  id: string;
  name: string;
  ready: boolean;
}

const PlayerColumn = ({ players }: { players: LobbyPlayer[] }) => (
  <Container
    width={LOBBY_SCENE_CONSTANTS.LAYOUT.PLAYER_COLUMN_WIDTH}
    flexDirection="column"
    gap={LOBBY_SCENE_CONSTANTS.LAYOUT.GAP.COLUMN_ITEMS}
  >
    {players.map((player) => (
      <Container
        key={player.id}
        height={LOBBY_SCENE_CONSTANTS.LAYOUT.PLAYER_ITEM_HEIGHT}
        backgroundColor={LOBBY_SCENE_CONSTANTS.COLORS.PLAYER_ITEM}
        borderRadius={LOBBY_SCENE_CONSTANTS.LAYOUT.BORDER_RADIUS.ITEM}
        paddingX={LOBBY_SCENE_CONSTANTS.LAYOUT.PADDING_X}
        alignItems="center"
        justifyContent="space-between"
        flexDirection="row"
      >
        <StyledText
          fontSize={LOBBY_SCENE_CONSTANTS.TYPOGRAPHY.PLAYER_NAME_SIZE}
          color={LOBBY_SCENE_CONSTANTS.COLORS.TEXT}
        >
          {player.name}
        </StyledText>
        <Container
          width={LOBBY_SCENE_CONSTANTS.LAYOUT.STATUS_INDICATOR.SIZE}
          height={LOBBY_SCENE_CONSTANTS.LAYOUT.STATUS_INDICATOR.SIZE}
          borderRadius={
            LOBBY_SCENE_CONSTANTS.LAYOUT.BORDER_RADIUS.STATUS_INDICATOR
          }
          backgroundColor={
            player.ready
              ? LOBBY_SCENE_CONSTANTS.COLORS.READY_ON
              : LOBBY_SCENE_CONSTANTS.COLORS.READY_OFF
          }
        />
      </Container>
    ))}
  </Container>
);

/**
 * Pre-game lobby scene showing player list and ready status
 * Players can ready up to start the game
 *
 * @component
 * @param {LobbySceneProps} props - Component props
 * @param {boolean} props.visible - Controls scene visibility
 * @param {Function} props.setCurrentScene - Scene transition handler
 */
const LobbyScene = () => {
  const { setCurrentScene } = useFpsGameStore();
  const [isReadyLoading, setIsReadyLoading] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const {
    myState,

    roomState,
    roomUsersState,
  } = useFpsNetworkStore();
  const { currentRoomId, subscribeRoom, subscribeRoomUsers, ready, leaveRoom } =
    useFpsGameNetwork();

  useEffect(() => {
    if (currentRoomId) {
      const unsubscribe = subscribeRoom(currentRoomId);
      const unsubscribeUser = subscribeRoomUsers(currentRoomId);
      return () => {
        if (unsubscribe) unsubscribe();
        if (unsubscribeUser) unsubscribeUser();
      };
    }
  }, [currentRoomId]);

  useEffect(() => {
    const myUserState = roomUsersState[myState?.account || ''];
    if (roomState?.status === 'PLAYING' && myUserState?.ready) {
      setCurrentScene('game');
    }
  }, [roomState?.status, roomUsersState, myState?.account, setCurrentScene]);

  const lobbyPlayers: LobbyPlayer[] = useMemo(
    () =>
      (roomState.$users || []).map((account: string) => {
        const user = roomUsersState[account];
        return {
          id: account,
          name: user?.playerState?.profile?.username || 'Loading...',
          ready: user?.ready || false,
        };
      }),
    [roomUsersState, roomState.$users]
  );

  // Split player list into two columns (even indices left, odd indices right)
  const { playersLeft, playersRight } = useMemo(() => {
    const left: LobbyPlayer[] = [];
    const right: LobbyPlayer[] = [];

    lobbyPlayers.forEach((player, index) => {
      if (index % 2 === 0) {
        left.push(player);
      } else {
        right.push(player);
      }
    });

    return { playersLeft: left, playersRight: right };
  }, [lobbyPlayers]);

  const handleReadyClick = async () => {
    if (isReadyLoading) return;

    setIsReadyLoading(true);
    try {
      const myUserState = roomUsersState[myState?.account || ''];
      await ready(!myUserState?.ready);
    } catch (error) {
      console.error('Failed to update ready state:', error);
    } finally {
      setIsReadyLoading(false);
    }
  };

  const isReady = useMemo(() => {
    const myUserState = roomUsersState[myState?.account || ''];
    return myUserState?.ready || false;
  }, [roomUsersState, myState?.account]);

  const handleBackClick = async () => {
    if (isLeavingRoom) return;

    setIsLeavingRoom(true);
    try {
      await leaveRoom();
      setCurrentScene('signin');
    } catch (error) {
      console.error('Failed to leave room:', error);
    } finally {
      setIsLeavingRoom(false);
    }
  };

  return (
    <group>
      <UICamera />
      <Fullscreen backgroundColor={LOBBY_SCENE_CONSTANTS.COLORS.BACKGROUND}>
        {/* Back Button - Fixed Position */}
        <Container
          position="absolute"
          left="0"
          top="0"
          pointerEvents="all"
          marginLeft={LOBBY_SCENE_CONSTANTS.LAYOUT.PADDING_X}
          marginTop={LOBBY_SCENE_CONSTANTS.LAYOUT.PADDING_X}
        >
          <Button
            variant="default"
            size="md"
            onClick={handleBackClick}
            disabled={isLeavingRoom}
          >
            {isLeavingRoom ? 'Leaving...' : 'Back'}
          </Button>
        </Container>

        {/* Main Content Container */}
        <Container
          width="100%"
          height="100%"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={LOBBY_SCENE_CONSTANTS.LAYOUT.GAP.SECTIONS}
        >
          {/* Title */}
          <Container>
            <StyledText
              fontSize={LOBBY_SCENE_CONSTANTS.TYPOGRAPHY.TITLE_SIZE}
              color={LOBBY_SCENE_CONSTANTS.COLORS.TEXT}
            >
              FPS Lobby
            </StyledText>
          </Container>

          {/* Room Info */}
          <Container
            width={LOBBY_SCENE_CONSTANTS.LAYOUT.PLAYER_LIST_WIDTH}
            backgroundColor={LOBBY_SCENE_CONSTANTS.COLORS.CONTAINER}
            borderRadius={LOBBY_SCENE_CONSTANTS.LAYOUT.BORDER_RADIUS.CONTAINER}
            padding={LOBBY_SCENE_CONSTANTS.LAYOUT.PADDING_X}
            flexDirection="column"
            gap={LOBBY_SCENE_CONSTANTS.LAYOUT.GAP.COLUMN_ITEMS}
          >
            <Container flexDirection="row" justifyContent="space-between">
              <StyledText
                fontSize={LOBBY_SCENE_CONSTANTS.TYPOGRAPHY.PLAYER_NAME_SIZE}
                color={LOBBY_SCENE_CONSTANTS.COLORS.TEXT}
              >
                Room ID
              </StyledText>
              <StyledText
                fontSize={LOBBY_SCENE_CONSTANTS.TYPOGRAPHY.PLAYER_NAME_SIZE}
                color={LOBBY_SCENE_CONSTANTS.COLORS.TEXT}
              >
                {currentRoomId || '-'}
              </StyledText>
            </Container>
            <Container flexDirection="row" justifyContent="space-between">
              <StyledText
                fontSize={LOBBY_SCENE_CONSTANTS.TYPOGRAPHY.PLAYER_NAME_SIZE}
                color={LOBBY_SCENE_CONSTANTS.COLORS.TEXT}
              >
                Players
              </StyledText>
              <StyledText
                fontSize={LOBBY_SCENE_CONSTANTS.TYPOGRAPHY.PLAYER_NAME_SIZE}
                color={LOBBY_SCENE_CONSTANTS.COLORS.TEXT}
              >
                {roomState?.$users?.length || 0} players
              </StyledText>
            </Container>
            <Container flexDirection="row" justifyContent="space-between">
              <StyledText
                fontSize={LOBBY_SCENE_CONSTANTS.TYPOGRAPHY.PLAYER_NAME_SIZE}
                color={LOBBY_SCENE_CONSTANTS.COLORS.TEXT}
              >
                Game State
              </StyledText>
              <StyledText
                fontSize={LOBBY_SCENE_CONSTANTS.TYPOGRAPHY.PLAYER_NAME_SIZE}
                color={LOBBY_SCENE_CONSTANTS.COLORS.TEXT}
              >
                {roomState?.status || 'UNKNOWN'}
              </StyledText>
            </Container>
          </Container>

          {/* Player List Container */}
          <Container
            width={LOBBY_SCENE_CONSTANTS.LAYOUT.PLAYER_LIST_WIDTH}
            backgroundColor={LOBBY_SCENE_CONSTANTS.COLORS.CONTAINER}
            borderRadius={LOBBY_SCENE_CONSTANTS.LAYOUT.BORDER_RADIUS.CONTAINER}
            padding={LOBBY_SCENE_CONSTANTS.LAYOUT.PADDING_X}
            flexDirection="row"
            justifyContent="space-between"
          >
            <PlayerColumn players={playersLeft} />
            <PlayerColumn players={playersRight} />
          </Container>

          {/* Ready Button */}
          <Button
            variant={isReady ? 'default' : 'confirmed'}
            size="xl"
            onClick={handleReadyClick}
            disabled={isReadyLoading}
          >
            {isReadyLoading ? 'Processing...' : isReady ? 'Cancel' : 'Ready'}
          </Button>
        </Container>
      </Fullscreen>
    </group>
  );
};

export default LobbyScene;

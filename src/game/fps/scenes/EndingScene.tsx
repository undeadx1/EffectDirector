import React from 'react';
import { Container, Fullscreen } from '@react-three/uikit';
import { Button, Defaults, StyledText } from '@/core/components';
import { UICamera } from '@/game/sample/camera';
import { useGameStore } from '@/game/sample/store';

interface PlayerScore {
  /** Unique player identifier */
  id: number;
  /** Player display name */
  name: string;
  /** Final game score */
  score: number;
  /** Player ranking (1-16) */
  rank: number;
}

const MOCK_SCORES: PlayerScore[] = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  name: `Player ${i + 1}`,
  score: Math.floor(Math.random() * 10000),
  rank: 0,
}))
  .sort((a, b) => b.score - a.score)
  .map((player, index) => ({
    ...player,
    rank: index + 1,
  }));

const SCORES_LEFT = MOCK_SCORES.slice(0, 8);
const SCORES_RIGHT = MOCK_SCORES.slice(8);

const ENDING_SCENE_CONSTANTS = {
  LAYOUT: {
    SCORE_COLUMN_WIDTH: 280,
    SCORE_LIST_WIDTH: 600,
    PLAYER_ITEM_HEIGHT: 40,
    PADDING_X: 16,
    GAP: {
      COLUMN_ITEMS: 8,
      SECTIONS: 32,
    },
    BORDER_RADIUS: {
      CONTAINER: 8,
      ITEM: 4,
    },
  },
  TYPOGRAPHY: {
    TITLE_SIZE: 48,
    TOP_RANK_SIZE: 18,
    NORMAL_RANK_SIZE: 16,
    PLAYER_NAME_SIZE: 16,
    SCORE_SIZE: 16,
  },
  COLORS: {
    BACKGROUND: '#000000',
    CONTAINER: '#111111',
    PLAYER_ITEM: '#222222',
    TOP_RANK_ITEM: '#2C3E50',
    TEXT: '#FFFFFF',
    RANK_TOP: '#FFD700',
    SCORE: '#4CAF50',
    EXIT_BUTTON: '#E53935',
    EXIT_BUTTON_HOVER: '#D32F2F',
  },
  GAME_RULES: {
    MAX_PLAYERS: 16,
    PLAYERS_PER_COLUMN: 8,
    TOP_RANK_THRESHOLD: 3,
  },
} as const;

/**
 * Score column component
 * Displays a vertical list of player scores with rankings
 */
const ScoreColumn = ({ scores }: { scores: PlayerScore[] }) => (
  <Container
    width={ENDING_SCENE_CONSTANTS.LAYOUT.SCORE_COLUMN_WIDTH}
    flexDirection="column"
    gap={ENDING_SCENE_CONSTANTS.LAYOUT.GAP.COLUMN_ITEMS}
  >
    {scores.map((player) => (
      <Container
        key={player.id}
        height={ENDING_SCENE_CONSTANTS.LAYOUT.PLAYER_ITEM_HEIGHT}
        backgroundColor={
          player.rank <= ENDING_SCENE_CONSTANTS.GAME_RULES.TOP_RANK_THRESHOLD
            ? ENDING_SCENE_CONSTANTS.COLORS.TOP_RANK_ITEM
            : ENDING_SCENE_CONSTANTS.COLORS.PLAYER_ITEM
        }
        borderRadius={ENDING_SCENE_CONSTANTS.LAYOUT.BORDER_RADIUS.ITEM}
        paddingX={ENDING_SCENE_CONSTANTS.LAYOUT.PADDING_X}
        alignItems="center"
        justifyContent="space-between"
        flexDirection="row"
      >
        <Container
          flexDirection="row"
          gap={ENDING_SCENE_CONSTANTS.LAYOUT.GAP.COLUMN_ITEMS}
          alignItems="center"
        >
          <StyledText
            fontSize={
              player.rank <=
              ENDING_SCENE_CONSTANTS.GAME_RULES.TOP_RANK_THRESHOLD
                ? ENDING_SCENE_CONSTANTS.TYPOGRAPHY.TOP_RANK_SIZE
                : ENDING_SCENE_CONSTANTS.TYPOGRAPHY.NORMAL_RANK_SIZE
            }
            color={
              player.rank <=
              ENDING_SCENE_CONSTANTS.GAME_RULES.TOP_RANK_THRESHOLD
                ? ENDING_SCENE_CONSTANTS.COLORS.RANK_TOP
                : ENDING_SCENE_CONSTANTS.COLORS.TEXT
            }
            fontWeight={
              player.rank <=
              ENDING_SCENE_CONSTANTS.GAME_RULES.TOP_RANK_THRESHOLD
                ? 'bold'
                : 'normal'
            }
          >
            {`#${player.rank}`}
          </StyledText>
          <StyledText
            fontSize={ENDING_SCENE_CONSTANTS.TYPOGRAPHY.PLAYER_NAME_SIZE}
            color={ENDING_SCENE_CONSTANTS.COLORS.TEXT}
          >
            {player.name}
          </StyledText>
        </Container>
        <StyledText
          fontSize={ENDING_SCENE_CONSTANTS.TYPOGRAPHY.SCORE_SIZE}
          color={ENDING_SCENE_CONSTANTS.COLORS.SCORE}
        >
          {player.score.toLocaleString()}
        </StyledText>
      </Container>
    ))}
  </Container>
);

/**
 * Post-game scene displaying final scores and rankings
 * Shows player rankings and provides option to exit
 *
 * @component
 */
const EndingScene = () => {
  const { setCurrentScene } = useGameStore();

  const handleExit = () => {
    setCurrentScene('signin');
  };

  return (
    <group>
      <UICamera />
      <Defaults>
        <Fullscreen
          backgroundColor={ENDING_SCENE_CONSTANTS.COLORS.BACKGROUND}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={ENDING_SCENE_CONSTANTS.LAYOUT.GAP.SECTIONS}
        >
          <Container>
            <StyledText
              fontSize={ENDING_SCENE_CONSTANTS.TYPOGRAPHY.TITLE_SIZE}
              color={ENDING_SCENE_CONSTANTS.COLORS.TEXT}
            >
              Game Over
            </StyledText>
          </Container>

          {/* Score List Container */}
          <Container
            width={ENDING_SCENE_CONSTANTS.LAYOUT.SCORE_LIST_WIDTH}
            backgroundColor={ENDING_SCENE_CONSTANTS.COLORS.CONTAINER}
            borderRadius={ENDING_SCENE_CONSTANTS.LAYOUT.BORDER_RADIUS.CONTAINER}
            padding={ENDING_SCENE_CONSTANTS.LAYOUT.PADDING_X}
            flexDirection="row"
            justifyContent="space-between"
          >
            <ScoreColumn scores={SCORES_LEFT} />
            <ScoreColumn scores={SCORES_RIGHT} />
          </Container>

          {/* Exit Button */}
          <Button size="xl" onClick={handleExit}>
            Exit
          </Button>
        </Fullscreen>
      </Defaults>
    </group>
  );
};

export default EndingScene;

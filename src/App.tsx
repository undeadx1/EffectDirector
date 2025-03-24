import { Game } from '@/game/fps/Game';

/**
 * Root application component
 * Initializes game server connection and renders the main game
 *
 * Features:
 * - Game server connection management
 * - Account and verse state tracking
 * - Connection status monitoring
 *
 * @component
 * @returns {JSX.Element} The rendered application
 */
const App = (): JSX.Element => {
  return <Game />;
};

export default App;

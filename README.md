# V8 Template 3D

This project serves as a 3D template for the AI GAME Generator. It is built using Three.js and React to set up a basic 3D environment, allowing developers to easily expand upon it.

## Project Structure

The project is organized into two main areas:

### Common Code (`src/`)

- `assets/` - Shared assets (models, animations, textures)
- `camera/` - Camera system components
- `components/` - Reusable UI components
- `lights/` - Lighting system components
- `objects/` - Base 3D object components
- `provider/` - React context providers
- `store/` - Global state management
- `types/` - Common TypeScript definitions

### Game Content (`src/game/`)

- `sample/` - Sample game implementation
  - `components/` - Game-specific components
  - `controls/` - Player control systems
  - `maps/` - Game maps and environments
  - `scenes/` - Game scene components
  - `store/` - Game state management
  - `types/` - Game-specific types
  - `ui/` - Game UI components

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Features

- Quarter-view character control system
- Physics-based interactions
- Dynamic camera modes
- Character animation system
- UI component library
- State management with Zustand
- Real-time multiplayer support

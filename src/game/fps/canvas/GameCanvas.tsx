import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { KeyboardControls, Sky } from '@react-three/drei';
import { Vector3, Vector2 } from 'three';
import * as THREE from 'three';
import Ecctrl, { CustomEcctrlRigidBody } from 'ecctrl';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  DepthOfField,
  Noise,
  Vignette,
  LUT,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { DefaultLights } from '@/game/fps/lights/DefaultLights';
import MeshMap from '@/game/fps/environment/MeshMap';
import PlayerBase from '@/game/fps/entity/player/PlayerBase';
import Entity from '@/game/fps/entity/Entity';
import { EffectSystem } from '@/game/fps/effect/EffectSystem';
import { useFpsGameStore } from '@/game/fps/store/fpsGameStore';
import { FpsCharacterActionType } from '@/game/fps/config/action';
import {
  DEFAULT_FPS_PLAYER_STATE,
  FpsCharacterState,
} from '@/game/fps/types/fps';
import { FPS_CHARACTER_CONSTANTS } from '@/game/fps/constants/characterConstants';
import { getRandomCorner } from '../environment/mapUtils';
import { CustomShaderEffect } from '@/game/fps/effect/CustomShaderEffect';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
  { name: 'action1', keys: ['1'] },
  { name: 'action2', keys: ['2'] },
  { name: 'action3', keys: ['3'] },
  { name: 'action4', keys: ['KeyF'] },
];

const GameCanvas: React.FC<{ physics: boolean; pausedPhysics: boolean }> = ({
  physics,
  pausedPhysics,
}) => {
  const playerRef = useRef<typeof PlayerBase>(null);
  const playerEcctrlRef = useRef<CustomEcctrlRigidBody>(null);

  const { selectedModel } = useFpsGameStore();

  /** Physics engine initialization state */
  const [isPhysicsReady, setIsPhysicsReady] = useState(false);
  /** Network player model references */

  // Detect physics initialization completion
  useEffect(() => {
    setIsPhysicsReady(true);
  }, []);

  const account = 'player';

  /** Initialize local player and sync with server */
  useEffect(() => {
    if (!isPhysicsReady || !account) return;

    const initPlayer = async () => {
      if (!account) return;
      console.log('Initializing local player', account);

      // 랜덤 꼭지점 선택
      const randomStartPosition = getRandomCorner();

      const initialCharacterState: FpsCharacterState = {
        modelPath: selectedModel,
        transform: {
          position: [
            randomStartPosition.x,
            randomStartPosition.y,
            randomStartPosition.z,
          ],
          rotation: FPS_CHARACTER_CONSTANTS.INITIAL_STATE.ROTATION,
        },
        currentAction: FpsCharacterActionType.AIM,
        isGrounded: true,
        currentHp: DEFAULT_FPS_PLAYER_STATE.stats.maxHp,
        verticalAim: 0,
        lastAttackerPosition: { x: 0, y: 0, z: 0 },
        pact: 0,
        score: 0,
      };
    };

    initPlayer();
  }, [isPhysicsReady, account, selectedModel]);

  // 게임 시작 시 한 번만 계산되는 플레이어 시작 위치
  const playerStartPoint = useMemo(() => getRandomCorner(), []);

  //console.log('myPlayerUserName', myPlayerUserName);

  const lutTexture = useMemo(() => {
    const texture = new THREE.TextureLoader().load(
      '/textures/lut/Blockbuster 14.png'
    );
    texture.generateMipmaps = false;
    return texture;
  }, []);

  return (
    <Canvas
      shadows
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('black');
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') {
          (e.target as HTMLCanvasElement).requestPointerLock();
        }
      }}
    >
      {/*<Stars />*/}
      {/*<Nebula />*/}
      <Sky sunPosition={[100, 10, 100]} distance={1000} />
      <DefaultLights />
      <Physics debug={physics} paused={pausedPhysics}>
        <MeshMap />

        <KeyboardControls map={keyboardMap}>
          <Ecctrl
            key={account}
            ref={playerEcctrlRef}
            disableFollowCam={false}
            camZoomSpeed={2}
            camCollision={false}
            camInitDis={0.01}
            camMinDis={0.01}
            camFollowMult={10000}
            camLerpMult={10000}
            turnVelMultiplier={1}
            turnSpeed={100}
            mode="CameraBasedMovement"
            camTargetPos={new Vector3(0, 0, 0)}
            position={playerStartPoint}
          >
            <Entity
              key={account}
              ref={playerRef}
              userName={account}
              userId={account}
              entityBase={PlayerBase}
              rigidBodyRef={playerEcctrlRef}
              startPosition={playerStartPoint}
            />
          </Ecctrl>
        </KeyboardControls>
      </Physics>
      <EffectComposer>
        <LUT lut={lutTexture} blendFunction={BlendFunction.ADD} />

        <Noise
          premultiply
          blendFunction={BlendFunction.OVERLAY}
          opacity={0.1}
        />
        <Vignette darkness={0.5} offset={0.1} />
        <DepthOfField focusDistance={0.01} focalLength={0.2} bokehScale={3} />
      </EffectComposer>
      <EffectSystem scopeId="game" />
    </Canvas>
  );
};

export default GameCanvas;

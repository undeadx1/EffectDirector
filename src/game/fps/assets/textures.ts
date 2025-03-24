import { TextureLoader, RepeatWrapping, SRGBColorSpace } from 'three';

/** Collection of texture file paths */
export const TEXTURES = {
  DIRT: '/textures/dirt.jpg',
  GRASS: '/textures/grass.jpg',
} as const;

/** Singleton texture loader instance */
const textureLoader = new TextureLoader();
/** Cache to store loaded textures */
const textureCache = new Map();

/**
 * Loads and caches a texture with default settings
 * @param path - Path to the texture file
 */
export const loadTexture = (path: string) => {
  if (!textureCache.has(path)) {
    const texture = textureLoader.load(path);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(50, 50);
    texture.colorSpace = SRGBColorSpace;
    textureCache.set(path, texture);
  }
  return textureCache.get(path);
};

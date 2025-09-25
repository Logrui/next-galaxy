// Type declarations for Three.js examples
declare module 'three/examples/jsm/loaders/EXRLoader.js' {
  import { Loader, LoadingManager, Texture } from 'three';
  
  export class EXRLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad?: (texture: Texture) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<Texture>;
    parse(buffer: ArrayBuffer): Texture;
  }
}

declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { Camera, EventDispatcher, MOUSE, Object3D, TOUCH, Vector3 } from 'three';

  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    
    object: Camera;
    domElement: HTMLElement | Document;
    
    // API
    enabled: boolean;
    target: Vector3;
    
    // Control settings
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    
    // Methods
    update(): boolean;
    dispose(): void;
    reset(): void;
  }
}

declare module 'canvas-sketch-util' {
  export const random: {
    range(min: number, max: number): number;
    rangeFloor(min: number, max: number): number;
    pick<T>(array: T[]): T;
    shuffle<T>(array: T[]): T[];
    noise1D(x: number, frequency?: number, amplitude?: number): number;
    noise2D(x: number, y: number, frequency?: number, amplitude?: number): number;
    noise3D(x: number, y: number, z: number, frequency?: number, amplitude?: number): number;
    setSeed(seed: number | string): void;
    getSeed(): number | string;
    value(): number;
    sign(): number;
    boolean(): boolean;
    gaussian(mean?: number, standardDerivation?: number): number;
  };
}

declare module 'simple-input-events' {
  interface InputEventData {
    position: [number, number];
    event: Event;
    inside: boolean;
    dragging: boolean;
    buttons: number;
    mods: {
      shift: boolean;
      alt: boolean;
      control: boolean;
      meta: boolean;
    };
  }

  interface InputEvents {
    on(event: 'move', callback: (data: InputEventData) => void): void;
    on(event: 'down', callback: (data: InputEventData) => void): void;
    on(event: 'up', callback: (data: InputEventData) => void): void;
    on(event: 'click', callback: (data: InputEventData) => void): void;
    off(event: string, callback?: Function): void;
    dispose(): void;
  }

  function createInputEvents(element: HTMLElement): InputEvents;
  export = createInputEvents;
}

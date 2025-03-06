import { AdbScrcpyClient } from '@yume-chan/adb-scrcpy';
import { clamp } from '@yume-chan/scrcpy';

export type ScreenCopyElement = HTMLDivElement | HTMLCanvasElement | HTMLVideoElement;
export type ScreenRotation = 'LANDSCAPE' | 'PORTRAIT' | 'REVERSE_LANDSCAPE' | 'REVERSE_PORTRAIT';
export type ScreenStateOptions = {
  element: ScreenCopyElement;
  width: number;
  height: number;
  rotation?: ScreenRotation;
  client: AdbScrcpyClient;
};
export type ScreenPosition = {
  x: number;
  y: number;
};

export class ScrcpyState {
  private options: ScreenStateOptions;
  constructor(option: ScreenStateOptions) {
    this.options = {
      rotation: 'PORTRAIT',
      ...option,
    };
  }

  get client() {
    return this.options.client;
  }

  get rotation() {
    switch (this.options.rotation) {
      case 'PORTRAIT':
        return 0;
      case 'LANDSCAPE':
        return 1;
      case 'REVERSE_LANDSCAPE':
        return 2;
      case 'REVERSE_PORTRAIT':
        return 3;
      default:
        return 0;
    }
  }

  get width() {
    return this.options.width;
  }

  get height() {
    return this.options.height;
  }

  get rotatedWidth() {
    return this.options.rotation === 'LANDSCAPE' ? this.options.height : this.options.width;
  }

  get rotatedHeight() {
    return this.options.rotation === 'LANDSCAPE' ? this.options.width : this.options.height;
  }

  get element() {
    return this.options.element;
  }

  clientPositionToDevicePosition(clientX: number, clientY: number): ScreenPosition {
    const { element: rendererContainer, width, height } = this.options;
    const viewRect = rendererContainer.getBoundingClientRect();
    let pointerViewX = clamp((clientX - viewRect.x) / viewRect.width, 0, 1);
    let pointerViewY = clamp((clientY - viewRect.y) / viewRect.height, 0, 1);
    if (this.rotation & 1) {
      [pointerViewX, pointerViewY] = [pointerViewY, pointerViewX];
    }
    switch (this.rotation) {
      case 1:
        pointerViewY = 1 - pointerViewY;
        break;
      case 2:
        pointerViewX = 1 - pointerViewX;
        pointerViewY = 1 - pointerViewY;
        break;
      case 3:
        pointerViewX = 1 - pointerViewX;
        break;
    }

    // console.log('PointerViewX:', pointerViewX, 'PointerViewY:', pointerViewY);
    // console.log('ClientX:', this.width, 'ClientY:', this.height);
    // console.log('rotation:', this.rotation);
    return {
      x: pointerViewX * width,
      y: pointerViewY * height,
    };
  }
}

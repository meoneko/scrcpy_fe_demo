import { AndroidMotionEventAction, AndroidMotionEventButton, ScrcpyPointerId } from '@yume-chan/scrcpy';
import { MouseEvent, PointerEvent } from 'react';
import { ScrcpyState } from './state';

type EventHandlerOptions = {
  screenState: ScrcpyState | null;
};

export class EventHandler {
  private options: EventHandlerOptions;
  constructor(options: EventHandlerOptions) {
    this.options = {
      ...options,
    };
  }

  public handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    event.currentTarget.setPointerCapture(event.pointerId);
    this.injectTouch(AndroidMotionEventAction.Down, event);
  }

  public handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    const { screenState } = this.options;
    if (!screenState || !screenState.client) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    this.injectTouch(AndroidMotionEventAction.Up, e);
  }

  public handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const { screenState } = this.options;
    if (!screenState || !screenState.client) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    this.injectTouch(e.buttons === 0 ? AndroidMotionEventAction.HoverMove : AndroidMotionEventAction.Move, e);
  }

  public handlePointerLeave(e: PointerEvent<HTMLDivElement>) {
    const { screenState } = this.options;
    if (!screenState || !screenState.client) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    // Because pointer capture on pointer down, this event only happens for hovering mouse and pen.
    // Release the injected pointer, otherwise it will stuck at the last position.
    this.injectTouch(AndroidMotionEventAction.HoverExit, e);
    this.injectTouch(AndroidMotionEventAction.Up, e);
  }

  public handleContextMenu(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    console.log('Context menu');
  }

  private injectTouch(action: AndroidMotionEventAction, e: PointerEvent<HTMLDivElement>) {
    const { screenState } = this.options;
    const { client, clientPositionToDevicePosition } = screenState || {};
    if (!client || !clientPositionToDevicePosition) {
      return;
    }

    const { pointerType } = e;
    let pointerId: bigint;
    if (pointerType === 'mouse') {
      // Android 13 has bug with mouse injection
      // https://github.com/Genymobile/scrcpy/issues/3708
      pointerId = ScrcpyPointerId.Finger;
    } else {
      pointerId = BigInt(e.pointerId);
    }

    const { x, y } = clientPositionToDevicePosition(e.clientX, e.clientY);
    console.log('ClientX:', x, 'ClientY:', y);
    if (screenState!.client) {
      console.log('Client is not valid');
      return;
    }

    client.controller!.injectTouch({
      action,
      pointerId,
      screenWidth: client.screenWidth,
      screenHeight: client.screenHeight,
      pointerX: x,
      pointerY: y,
      pressure: e.pressure,
      actionButton: MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON[e.button],
      buttons: e.buttons,
    });
  }
}

const MOUSE_EVENT_BUTTON_TO_ANDROID_BUTTON = [
  AndroidMotionEventButton.Primary,
  AndroidMotionEventButton.Tertiary,
  AndroidMotionEventButton.Secondary,
  AndroidMotionEventButton.Back,
  AndroidMotionEventButton.Forward,
];

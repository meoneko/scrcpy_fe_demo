import { Adb } from '@yume-chan/adb';
import { AdbScrcpyOptions2_1 } from '@yume-chan/adb-scrcpy';
import { ScrcpyOptions3_1 } from '@yume-chan/scrcpy';
import { VideoFrameRenderer } from '@yume-chan/scrcpy-decoder-webcodecs';
import { ReadableStream } from '@yume-chan/stream-extra';
import { DefaultServerPath } from '@yume-chan/scrcpy';
import {
  InsertableStreamVideoFrameRenderer,
  WebGLVideoFrameRenderer,
  BitmapVideoFrameRenderer,
} from '@yume-chan/scrcpy-decoder-webcodecs';

export function getOptions(): AdbScrcpyOptions2_1 {
  return new AdbScrcpyOptions2_1(
    new ScrcpyOptions3_1({
      videoSource: 'display',
      control: true,
      videoCodec: 'h264',
      audio: false,
      video: true,
      maxSize: 1080,
      sendCodecMeta: true,
      sendFrameMeta: true,
    }),
  );
}

export function createVideoFrameRenderer(): {
  renderer: VideoFrameRenderer;
  element: HTMLVideoElement | HTMLCanvasElement;
} {
  if (InsertableStreamVideoFrameRenderer.isSupported) {
    const renderer = new InsertableStreamVideoFrameRenderer();
    return { renderer, element: renderer.element };
  }

  if (WebGLVideoFrameRenderer.isSupported) {
    const renderer = new WebGLVideoFrameRenderer();
    return { renderer, element: renderer.canvas as HTMLCanvasElement };
  }

  const renderer = new BitmapVideoFrameRenderer();
  return { renderer, element: renderer.canvas as HTMLCanvasElement };
}

export async function pushServerAsync(adb: Adb): Promise<boolean> {
  const sync = await adb.sync();
  const response = await fetch('http://localhost:5173/scrcpy-server.jar');

  try {
    await sync.write({
      filename: DefaultServerPath,
      // The `ReadableStream` type in TypeScript `lib.dom.d.ts` is not compatible with Tango's Web Streams API typings
      file: response.body as never as ReadableStream<Uint8Array>,
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  } finally {
    await sync.dispose();
  }
}

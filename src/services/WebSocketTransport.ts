import { MaybePromiseLike } from '@yume-chan/async';
import { MaybeConsumable, ReadableStream } from '@yume-chan/stream-extra';
import {
  ADB_DAEMON_DEFAULT_FEATURES,
  AdbBanner,
  AdbIncomingSocketHandler,
  AdbReverseNotSupportedError,
  type AdbSocket,
  type AdbTransport,
} from '@yume-chan/adb';

export class WebSocketTransport implements AdbTransport {
  serial: string;
  maxPayloadSize: number;
  banner: AdbBanner;

  #sockets = new Set<WebSocketStream>();
  #reverseTunnels = new Map<string, AdbIncomingSocketHandler>();

  #disconnected = (() => {
    let resolve: () => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  })();

  get disconnected() {
    return this.#disconnected.promise;
  }

  clientFeatures = ADB_DAEMON_DEFAULT_FEATURES;

  constructor(serial: string, maxPayloadSize: number, banner: AdbBanner) {
    this.serial = serial;
    this.maxPayloadSize = maxPayloadSize;
    this.banner = banner;
  }

  async connect(service: string): Promise<AdbSocket> {
    console.log('service: ', service);
    const socket = new WebSocketStream(`ws://155.138.229.75:8080/device/${this.serial}/${encodeURIComponent(service)}`);
    const open = await socket.opened;
    this.#sockets.add(socket);

    const writer = open.writable.getWriter();
    return {
      service,
      readable: open.readable.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, controller) {
            controller.enqueue(new Uint8Array(chunk));
          },
        }),
      ) as ReadableStream<Uint8Array>,
      writable: new MaybeConsumable.WritableStream({
        async write(chunk) {
          await writer.write(chunk);
        },
      }),
      close() {
        socket.close();
      },
      closed: socket.closed as never as Promise<void>,
    };
  }

  addReverseTunnel(): MaybePromiseLike<string> {
    throw new AdbReverseNotSupportedError();
  }

  removeReverseTunnel(): MaybePromiseLike<void> {
    throw new AdbReverseNotSupportedError();
  }

  clearReverseTunnels(): MaybePromiseLike<void> {
    throw new AdbReverseNotSupportedError();
  }

  close() {
    for (const socket of this.#sockets) {
      socket.close();
    }
    this.#sockets.clear();
    this.#reverseTunnels.clear();
    this.#disconnected.resolve();
  }
}

import { AdbBanner } from '@yume-chan/adb';
import { WebSocketTransport } from './WebSocketTransport';
import { BaseResponse } from '../models/models';

export async function createTransportAsync(
  serverIp: string,
  serverPort: number,
  serial: string,
): Promise<BaseResponse<WebSocketTransport>> {
  const response = await fetch(`https://${serverIp}:${serverPort}/device/${serial}`);
  if (!response.ok) {
    return {
      success: false,
    };
  }

  const data = await response.json();
  const transport = new WebSocketTransport(
    serial,
    data.maxPayloadSize,
    new AdbBanner(data.product, data.model, data.device, data.features),
  );

  return {
    success: true,
    data: transport,
  };
}

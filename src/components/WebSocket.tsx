import { Adb } from '@yume-chan/adb';
import { WebCodecsVideoDecoder } from '@yume-chan/scrcpy-decoder-webcodecs';
import { AdbScrcpyClient } from '@yume-chan/adb-scrcpy';
import { DefaultServerPath } from '@yume-chan/scrcpy';

import { createTransportAsync } from '../services/createTransport';
import { getOptions, createVideoFrameRenderer, pushServerAsync } from '../services/utils';
import VideoFrame from './VideoFrame';
import { useState } from 'react';
import { ScrcpyState } from "../services/state";

console.log(WebCodecsVideoDecoder.isSupported);

const urlDevices = 'ws://155.138.229.75:8080/devices';
const ws = new WebSocket(urlDevices);

ws.onopen = () => console.log('Connected to WebSocket');
ws.onclose = () => console.log('WebSocket closed');
ws.onerror = (error) => console.error('WebSocket error', error);

const WebSocketComponent: React.FC = () => {
  const { element, renderer } = createVideoFrameRenderer();
  const [serverIp, setServerIp] = useState<string>('localhost');
  const [serverPort, setServerPort] = useState<number>(8080);
  const [deviceId, setDeviceIp] = useState<string>('AHD00011661');
  const [adb, setAdb] = useState<Adb | null>(null);
  const [, setClient] = useState<AdbScrcpyClient | null>(null);
  const [screenState, setScreenState] = useState<ScrcpyState | null>(null);

  ws.onmessage = (event) => {
    console.log(event.data);
  };

  const handleConnectServer = () => {
    const serverIp = document.getElementById('serverIp') as HTMLInputElement;
    const serverPort = document.getElementById('serverPort') as HTMLInputElement;
    const deviceId = document.getElementById('deviceId') as HTMLInputElement;
    if (!serverIp) {
      console.log('Server IP not found');
    } else {
      setServerIp(serverIp.value);
      console.log('Server IP:', serverIp.value);
    }

    if (!serverPort) {
      console.log('Server Port not found');
    } else {
      setServerPort(Number(serverPort.value));
      console.log('Server Port:', serverPort.value);
    }

    if (!deviceId) {
      console.log('Device ID not found');
    } else {
      setDeviceIp(deviceId.value);
      console.log('Device ID:', deviceId.value);
    }

  };

  const handleButtonClick = async () => {
    const { success, data: transport } = await createTransportAsync(serverIp, serverPort, deviceId);

    if (!success || !transport) {
      console.log('Create transport error');
      return;
    }

    console.log('Create transport successfully', transport);

    const adb = new Adb(transport);
    setAdb(adb);

    console.log('Create ADB successfully!');
  };

  const handlePushServer = async () => {
    if (!adb) {
      console.log('Please connect ADB first');
      return;
    }

    const isSuccess = await pushServerAsync(adb);
    if (!isSuccess) {
      console.log('Push .jar to server failed');
      return;
    }

    console.log('Pushed .jar to device');
  };

  const handleVideoStream = async () => {
    if (!adb) {
      console.log('Please connect ADB first');
      return;
    }

    console.log('Starting connect to scr server');
    const scClient: AdbScrcpyClient = await AdbScrcpyClient.start(adb, DefaultServerPath, getOptions());

    const state = new ScrcpyState({
      element: element,
      width: scClient.screenWidth ?? 0,
      height: scClient.screenHeight ?? 0,
      client: scClient,
    });

    setScreenState(state);
    setClient(scClient);

    if (scClient.videoStream) {
      const { metadata: videoMetadata, stream: videoPacketStream } = await scClient.videoStream;

      const decoder = new WebCodecsVideoDecoder({
        codec: videoMetadata.codec,
        renderer: renderer,
      });

      void videoPacketStream.pipeTo(decoder.writable).catch((e) => {
        console.error(e);
      });
    }
  };

  const handleRotate = async () => {
  };

  return (
    <div>
      <h2>WebSocket Messages</h2>
      <input type="text" placeholder='Server IP' id='serverIp' />
      <input type="number" placeholder='Server Port' id='serverPort' />
      <input type="text" placeholder='Device ID' id='deviceId' />
      <button onClick={handleConnectServer}>Create Connect</button>
      <br />
      <button onClick={handleButtonClick}>Create ADB</button>
      <button onClick={handlePushServer}>Push server</button>
      <button onClick={handleVideoStream}>Video stream</button>
      <button onClick={handleRotate}>Rotate</button>
      <VideoFrame screenState={screenState} />
    </div>
  );
};

export default WebSocketComponent;

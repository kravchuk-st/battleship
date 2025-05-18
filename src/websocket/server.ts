import { WebSocketServer } from 'ws';
import { IPlayer, ICustomWebSocket, IRoom } from '../types'

const webSocketPort = 3000

export let players: IPlayer[] = [];
export let connections: ICustomWebSocket[] = [];
export let roomUsers: IRoom[] = [];

export function handleRequest(ws: ICustomWebSocket, request: Request) {
  console.log(request);
}

export const wss = new WebSocketServer({
  port: webSocketPort,
});

wss.on('connection', (ws: ICustomWebSocket) => {
  console.log(`A client connected on the ${webSocketPort} webSocketPort`);

  ws.on('message', (message: string) => {
    const request = JSON.parse(message);
    handleRequest(ws, request);
  });

  ws.on('close', () => {
    console.log('A client disconnected');
  });
});

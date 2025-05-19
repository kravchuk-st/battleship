import { WebSocketServer } from 'ws';
import { playerExists } from 'src/db';
import { ICustomWebSocket, IRequest } from 'src/types';

import { handleLogin } from './handleLogin';
import { handleRegistration } from './handleRegistration';

const webSocketPort = 3000;

export function handleRequest(ws: ICustomWebSocket, request: IRequest) {
  console.log(request);

  switch (request.type) {
    case 'reg':
      if (playerExists(request)) {
        handleLogin(ws, request);
      } else {
        handleRegistration(ws, request);
      }

      break;
  }
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

import { botCreation } from './botCreation';
import { data } from 'src/db';
import { ICustomWebSocket, IRequest, IPlayer } from 'src/types';

export function handleLogin(ws: ICustomWebSocket, request: IRequest) {
  const { name, password }: IPlayer = JSON.parse(request.data);

  const player = data.players.find((player) => player.name === name && player.password === password) as IPlayer;

  if (!player) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        error: true,
        errorText: 'Invalid password',
      }),
      id: 0,
    };
    console.log('Invalid password');

    ws.send(JSON.stringify(response));
    return;
  } else {
    const loginPlayer = data.players.find((player) => player.name === name && player.password === password) as IPlayer;

    ws.index = loginPlayer?.index;

    data.connections.push(ws);

    const response = {
      type: 'reg',
      data: JSON.stringify({
        name: name,
        index: ws.index,
        error: false,
        errorText: '',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
    botCreation();
  }
}

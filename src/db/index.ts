import { v4 as uuidv4 } from 'uuid';
import { IRequest, IPlayer, IRoom, ICustomWebSocket } from 'src/types';

export let players: IPlayer[] = [];
export let connections: ICustomWebSocket[] = [];
export let roomUsers: IRoom[] = [];

export function playerExists(request: IRequest) {
  const { name }: IPlayer = JSON.parse(request.data);
  return players.some((player) => player.name === name);
}

export function registerPlayer(name: string, password: string, ws: ICustomWebSocket) {
  const userId = uuidv4();

  ws.index = userId;

  const newPlayer = {
    name,
    password,
    index: ws.index,
    wins: 0,
  };

  players.push(newPlayer);
  connections.push(ws);

  const response = {
    type: 'reg',
    data: JSON.stringify({
      name,
      index: ws.index,
      error: false,
      errorText: '',
    }),
    id: 0,
  };

  return response;
}

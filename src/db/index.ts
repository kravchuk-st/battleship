import { v4 as uuidv4 } from 'uuid';
import { IData, IRequest, IPlayer, ICustomWebSocket } from 'src/types';

export const data: IData = {
  players: [],
  connections: [],
  roomUsers: [],
  winners: [],
  currentGames: [],
};

export function playerExists(request: IRequest) {
  const { name }: IPlayer = JSON.parse(request.data);
  return data.players.some((player) => player.name === name);
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

  data.players.push(newPlayer);
  data.connections.push(ws);

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

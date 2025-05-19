import { data } from 'src/db';
import { updateRoom } from './updateRoom';
import { ICustomWebSocket, IPlayer } from 'src/types';

export function handleRoomCreate(ws: ICustomWebSocket) {
  if (data.roomUsers.find((room) => room.roomId === ws.index)) return;

  const creator = data.players.find((player) => player.index === ws.index) as IPlayer;

  const newRoom = {
    roomId: creator.index,
    roomUsers: [
      {
        name: creator.name,
        index: creator.index,
      },
    ],
  };

  data.roomUsers.push(newRoom);
  updateRoom();
}

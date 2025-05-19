import { data, changeData } from 'src/db';
import { updateRoom } from './updateRoom';
import { ICustomWebSocket, IRequest, IPlayer, IIndexRoom, IRoom } from 'src/types';

const addUserToExistRoom = (ws: ICustomWebSocket, request: IRequest) => {
  const roomIndex = JSON.parse(request.data) as IIndexRoom;

  const isThePlayerTheCreatorOfTheRoom = roomIndex.indexRoom === ws.index;

  if (isThePlayerTheCreatorOfTheRoom) return;

  const response = {
    type: 'add_user_to_room',
    data: JSON.stringify({
      indexRoom: roomIndex,
    }),
    id: 0,
  };

  const addPlayerToRoom = data.players.find((player) => player.index === ws.index) as IPlayer;

  const theRoomToWhichWeAddThePlayer = data.roomUsers.find((room) => room.roomId === roomIndex.indexRoom) as IRoom;

  if (data.roomUsers.find((room) => room.roomId === addPlayerToRoom.index)) {
    let newUsers = data.roomUsers.filter((room) => room.roomId !== addPlayerToRoom.index);
    changeData('roomUsers', newUsers);
  }

  theRoomToWhichWeAddThePlayer.roomUsers.push(addPlayerToRoom);

  ws.send(JSON.stringify(response));
  updateRoom();
  placementOfShipsForTheGame(request);
};

const placementOfShipsForTheGame = (request: IRequest) => {
  const req = JSON.parse(request.data) as IIndexRoom;
  const currentRoom = data.roomUsers.find((room) => room.roomId === req.indexRoom) as IRoom;

  const creator = currentRoom.roomUsers.find((player) => player.index === req.indexRoom) as IPlayer;

  const secondPlayer = currentRoom.roomUsers.filter((player) => player.index !== creator.index)[0];

  const data1 = JSON.stringify({
    idGame: creator.index,
    idPlayer: creator.index,
  });

  const data2 = JSON.stringify({
    idGame: creator.index,
    idPlayer: secondPlayer.index,
  });

  const response1 = {
    type: 'create_game',
    data: data1,
    id: 0,
  };

  const response2 = {
    type: 'create_game',
    data: data2,
    id: 0,
  };

  const connection1 = data.connections.find((item) => item.index === creator.index) as ICustomWebSocket;
  const connection2 = data.connections.find((item) => item.index === secondPlayer.index) as ICustomWebSocket;

  connection1.send(JSON.stringify(response1));
  connection2.send(JSON.stringify(response2));

  let newRoomUsers = data.roomUsers.filter((room) => room.roomId !== currentRoom.roomId);
  changeData('roomUsers', newRoomUsers);

  updateRoom();
};

export function addUserToRoom(ws: ICustomWebSocket, request: IRequest) {
  addUserToExistRoom(ws, request);
}

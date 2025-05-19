import { data } from 'src/db';

export const updateRoom = () => {
  const creator = data.roomUsers.filter((room) => room.roomUsers.length === 1);

  const update = JSON.stringify(creator);

  const response = {
    type: 'update_room',
    data: update,
    id: 0,
  };

  data.connections.forEach((ws) => {
    ws.send(JSON.stringify(response));
  });
};

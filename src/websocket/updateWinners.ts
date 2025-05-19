import { data } from 'src/db';

export const winnerUpdateResponse = () => {
  if (data.winners.length === 0) return;

  const response = {
    type: 'update_winners',
    data: JSON.stringify(data.winners),
    id: 0,
  };

  data.connections.forEach((ws) => {
    ws.send(JSON.stringify(response));
  });
};

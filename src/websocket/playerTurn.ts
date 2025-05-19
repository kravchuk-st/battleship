import { ICustomWebSocket } from 'src/types';

export const playerTurn = (firstPlayer: ICustomWebSocket, secondPlayer: ICustomWebSocket, index: string) => {
  const response = {
    type: 'turn',
    data: JSON.stringify({
      currentPlayer: index,
    }),
    id: 0,
  };

  firstPlayer.send(JSON.stringify(response));
  secondPlayer.send(JSON.stringify(response));
};

import { ICustomWebSocket } from 'src/types';

export const playerTurnWithBot = (firstPlayer: ICustomWebSocket, index: string) => {
  const response = {
    type: 'turn',
    data: JSON.stringify({
      currentPlayer: index,
    }),
    id: 0,
  };

  firstPlayer.send(JSON.stringify(response));
};

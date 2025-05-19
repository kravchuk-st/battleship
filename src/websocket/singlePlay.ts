import { updateRoom } from './updateRoom';
import { generateBotShips } from './generateBotShips';
import { data } from 'src/db';
import { ICustomWebSocket, IPlayer, IPlayerMatrixForTheGame } from 'src/types';

export const singlePlay = (ws: ICustomWebSocket) => {
  if (data.roomUsers.some((room) => room.roomId === ws.index)) {
    data.roomUsers = data.roomUsers.filter((room) => room.roomId !== ws.index);
    updateRoom();
  }

  const bots = data.players.filter((player) => player.name === 'BOT');

  const freeBots: IPlayer[] = [];

  for (let i = 0; i < bots.length; i += 1) {
    const currentBot = bots[i];
    if (!data.currentGames.some((bot) => bot.indexPlayer === currentBot.index)) {
      freeBots.push(currentBot);
    }
  }

  const currentBot = freeBots[0];

  const data1 = JSON.stringify({
    idGame: ws.index,
    idPlayer: ws.index,
  });

  const response1 = {
    type: 'create_game',
    data: data1,
    id: 0,
  };

  const connection1 = data.connections.find((item) => item.index === ws.index) as ICustomWebSocket;

  const matrix = generateBotShips();

  const bot: IPlayerMatrixForTheGame = {
    currentGameId: ws.index,
    ships: matrix,
    indexPlayer: currentBot.index,
    turn: false,
  };

  data.currentGames.push(bot);

  connection1.send(JSON.stringify(response1));
};

import { data } from 'src/db';
import { IPlayer, IRequest, IPlayerCoordinates } from 'src/types';

export const isGameWithBot = (request: IRequest) => {
  const dataReq = JSON.parse(request.data) as IPlayerCoordinates;

  const bot = data.currentGames.filter((game) => game.currentGameId === dataReq.gameId);
  if (bot === undefined) return;

  if (bot.length === 2) {
    const bot1 = data.players.find((player) => player.index === bot[0].indexPlayer) as IPlayer;
    const bot2 = data.players.find((player) => player.index === bot[1].indexPlayer) as IPlayer;

    return bot1.name === 'BOT' || bot2.name === 'BOT';
  }
};

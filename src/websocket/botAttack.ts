import { generateRandomCoordinates } from './generateRandomCoordinates';
import { checkAttack } from './checkAttack';
import { playerTurnWithBot } from './playerTurnWithBot';
import { getUpdatedCoordinates } from './getUpdatedCoordinates';
import { isAllShipsDestroyed } from './isAllShipsDestroyed';
import { updateWinners } from './';
import { data } from 'src/db';
import {
  IPlayerMatrixForTheGame,
  IRequest,
  IResponse,
  IPlayerCoordinates,
  ICustomWebSocket,
  IFinishMessage,
} from 'src/types';

export const botAttack = (realPlayer: IPlayerMatrixForTheGame, request?: IRequest) => {
  let bot: IPlayerMatrixForTheGame;
  const currentGame = data.currentGames.filter((game) => game.currentGameId === realPlayer.currentGameId);

  if (request) {
    const currentBot = JSON.parse(request.data) as IPlayerCoordinates;
    bot = currentGame.find((item) => item.indexPlayer === currentBot.indexPlayer) as IPlayerMatrixForTheGame;
  } else {
    bot = currentGame.filter((item) => item.indexPlayer !== realPlayer.indexPlayer)[0];
  }

  const newCoords = generateRandomCoordinates(realPlayer.ships);

  const { status, updatedMatrix } = checkAttack(realPlayer.ships, newCoords);

  data.currentGames = data.currentGames.map((item) =>
    item.indexPlayer === realPlayer.indexPlayer ? { ...item, ships: updatedMatrix } : item
  );

  const connectionPlayer = data.connections.find((item) => item.index === realPlayer.indexPlayer) as ICustomWebSocket;

  if (status === 'shot') {
    const response: IResponse = {
      type: 'attack',
      data: JSON.stringify({
        position: newCoords,
        currentPlayer: bot.indexPlayer,
        status: status,
      }),
      id: 0,
    };

    const updatedPlayer = {
      currentGameId: realPlayer.currentGameId,
      indexPlayer: realPlayer.indexPlayer,
      ships: updatedMatrix,
      turn: false,
    };

    connectionPlayer.send(JSON.stringify(response));

    playerTurnWithBot(connectionPlayer, bot.indexPlayer);

    setTimeout(() => {
      botAttack(updatedPlayer);
    }, 1000);
  } else if (status === 'killed') {
    const updatedCoordinates = getUpdatedCoordinates(realPlayer.ships, updatedMatrix);

    for (let i = 0; i < updatedCoordinates.length; i++) {
      const coord = updatedCoordinates[i];
      const response: IResponse = {
        type: 'attack',
        data: JSON.stringify({
          position: {
            x: coord.x,
            y: coord.y,
          },
          currentPlayer: bot.indexPlayer,
          status: coord.status,
        }),
        id: 0,
      };

      connectionPlayer.send(JSON.stringify(response));
    }

    const updatedPlayer = {
      currentGameId: realPlayer.currentGameId,
      indexPlayer: realPlayer.indexPlayer,
      ships: updatedMatrix,
      turn: false,
    };

    const destroyed = isAllShipsDestroyed(updatedMatrix);
    if (destroyed) {
      const dataDestroyed = JSON.stringify({
        winPlayer: bot.indexPlayer,
      });

      const response: IFinishMessage = {
        type: 'finish',
        data: dataDestroyed,
        id: 0,
      };

      connectionPlayer.send(JSON.stringify(response));

      updateWinners(bot.indexPlayer);
      data.currentGames = data.currentGames.filter((game) => game.currentGameId !== realPlayer.currentGameId);
      return;
    } else {
      playerTurnWithBot(connectionPlayer, bot.indexPlayer);

      setTimeout(() => {
        botAttack(updatedPlayer);
      }, 1000);
    }
  } else {
    data.currentGames = data.currentGames.map((game) => {
      if (game.indexPlayer === bot.indexPlayer) {
        return { ...game, turn: false };
      } else if (game.indexPlayer === realPlayer.indexPlayer) {
        return { ...game, turn: true };
      }

      return game;
    });

    const response: IResponse = {
      type: 'attack',
      data: JSON.stringify({
        position: newCoords,
        currentPlayer: bot.indexPlayer,
        status: status,
      }),
      id: 0,
    };

    connectionPlayer.send(JSON.stringify(response));

    playerTurnWithBot(connectionPlayer, realPlayer.indexPlayer);
  }
};

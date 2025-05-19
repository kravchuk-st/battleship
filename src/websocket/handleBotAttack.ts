import { botAttack } from './botAttack';
import { checkAttack } from './checkAttack';
import { updateWinners } from './';
import { getUpdatedCoordinates } from './getUpdatedCoordinates';
import { generateRandomCoordinates } from './generateRandomCoordinates';
import { isAllShipsDestroyed } from './isAllShipsDestroyed';
import { playerTurnWithBot } from './playerTurnWithBot';
import { data } from 'src/db';
import {
  ICustomWebSocket,
  IRequest,
  IResponse,
  IPlayerMatrixForTheGame,
  IPlayerCoordinates,
  IPlayer,
  ICoordinates,
  IAttackFeedback,
  IFinishMessage,
} from 'src/types';

export const handleBotAttack = (ws: ICustomWebSocket, request: IRequest, bot: boolean) => {
  const currentPlayer = JSON.parse(request.data) as IPlayerCoordinates;

  const isCurrentPlayerBot = data.players.find((player) => player.index === currentPlayer.indexPlayer) as IPlayer;

  const currentGame = data.currentGames.filter((player) => player.currentGameId === ws.index);

  if (isCurrentPlayerBot.name === 'BOT') {
    const playerAkaEnemy = currentGame.find((game) => game.indexPlayer == ws.index) as IPlayerMatrixForTheGame;

    if (playerAkaEnemy === undefined) return;

    setTimeout(() => {
      botAttack(playerAkaEnemy, request);
    }, 1000);
  } else {
    let coordinates: ICoordinates;

    const player = currentGame.find((game) => game.indexPlayer === ws.index) as IPlayerMatrixForTheGame;

    const enemy = currentGame.filter((game) => game.indexPlayer !== player.indexPlayer)[0];

    if (enemy === undefined) return;

    if (enemy.turn) return;

    const enemyShips = enemy.ships;

    if (bot) {
      coordinates = generateRandomCoordinates(enemyShips);
    } else {
      coordinates = {
        x: currentPlayer.x,
        y: currentPlayer.y,
      };
    }

    const { status, updatedMatrix } = checkAttack(enemyShips, coordinates) as IAttackFeedback;

    data.currentGames = data.currentGames.map((item) =>
      item.indexPlayer === enemy.indexPlayer ? { ...item, ships: updatedMatrix } : item
    );

    const connection1 = data.connections.find((item) => item.index === player.indexPlayer) as ICustomWebSocket;

    if (status === 'retry') {
      const cell = updatedMatrix[currentPlayer.y][currentPlayer.x];

      const response: IResponse = {
        type: 'attack',
        data: JSON.stringify({
          position: coordinates,
          currentPlayer: player.indexPlayer,
          status: cell,
        }),
        id: 0,
      };

      connection1.send(JSON.stringify(response));
      playerTurnWithBot(connection1, player.indexPlayer);
    } else if (status === 'shot') {
      const response: IResponse = {
        type: 'attack',
        data: JSON.stringify({
          position: coordinates,
          currentPlayer: player.indexPlayer,
          status: status,
        }),
        id: 0,
      };

      connection1.send(JSON.stringify(response));
      playerTurnWithBot(connection1, player.indexPlayer);
    } else if (status === 'killed') {
      const updatedCoordinates = getUpdatedCoordinates(enemyShips, updatedMatrix);

      for (let i = 0; i < updatedCoordinates.length; i++) {
        const coord = updatedCoordinates[i];
        const response: IResponse = {
          type: 'attack',
          data: JSON.stringify({
            position: {
              x: coord.x,
              y: coord.y,
            },
            currentPlayer: player.indexPlayer,
            status: coord.status,
          }),
          id: 0,
        };

        connection1.send(JSON.stringify(response));
      }

      const destroyed = isAllShipsDestroyed(updatedMatrix);

      if (destroyed) {
        const dataDestroyed = JSON.stringify({
          winPlayer: currentPlayer.indexPlayer,
        });

        const response: IFinishMessage = {
          type: 'finish',
          data: dataDestroyed,
          id: 0,
        };

        connection1.send(JSON.stringify(response));

        updateWinners(player.indexPlayer);

        data.currentGames = data.currentGames.filter((game) => game.currentGameId !== ws.index);

        return;
      } else {
        playerTurnWithBot(connection1, currentPlayer.indexPlayer);
      }
    } else {
      data.currentGames = data.currentGames.map((game) => {
        if (game.indexPlayer === currentPlayer.indexPlayer) {
          return { ...game, turn: false };
        } else if (game.indexPlayer === enemy.indexPlayer) {
          return { ...game, turn: true };
        }

        return game;
      });

      const response: IResponse = {
        type: 'attack',
        data: JSON.stringify({
          position: coordinates,
          currentPlayer: currentPlayer.indexPlayer,
          status: status,
        }),
        id: 0,
      };

      connection1.send(JSON.stringify(response));

      playerTurnWithBot(connection1, enemy.indexPlayer);

      setTimeout(() => {
        botAttack(player);
      }, 1000);
    }
  }
};

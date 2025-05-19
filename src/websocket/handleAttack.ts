import { playerTurn } from './playerTurn';
import { checkAttack } from './checkAttack';
import { generateRandomCoordinates } from './generateRandomCoordinates';
import { getUpdatedCoordinates } from './getUpdatedCoordinates';
import { isAllShipsDestroyed } from './isAllShipsDestroyed';
import { updateWinners } from './';
import { data } from 'src/db';
import {
  IRequest,
  IResponse,
  IPlayerCoordinates,
  ICoordinates,
  ICustomWebSocket,
  IAttackFeedback,
  IFinishMessage,
} from 'src/types';

export const handleAttack = (request: IRequest, bot: boolean) => {
  const currentPlayer: IPlayerCoordinates = JSON.parse(request.data);
  let coordinates: ICoordinates;

  const currentGameArray = data.currentGames.filter((game) => game.currentGameId === currentPlayer.gameId);

  const enemy = currentGameArray.filter((enemy) => enemy.indexPlayer !== currentPlayer.indexPlayer)[0];

  if (enemy === undefined) return;

  const enemyShips = enemy.ships.map((rows) => [...rows]);

  if (enemy.turn) return;

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

  const connection1 = data.connections.find((item) => item.index === currentPlayer.indexPlayer) as ICustomWebSocket;

  const connection2 = data.connections.find((item) => item.index === enemy.indexPlayer) as ICustomWebSocket;

  if (status === 'retry') {
    const cell = updatedMatrix[currentPlayer.y][currentPlayer.x];

    const response: IResponse = {
      type: 'attack',
      data: JSON.stringify({
        position: coordinates,
        currentPlayer: currentPlayer.indexPlayer,
        status: cell,
      }),
      id: 0,
    };

    connection1.send(JSON.stringify(response));
    connection2.send(JSON.stringify(response));
    playerTurn(connection1, connection2, currentPlayer.indexPlayer);
  } else if (status === 'shot') {
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
    connection2.send(JSON.stringify(response));
    playerTurn(connection1, connection2, currentPlayer.indexPlayer);
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
          currentPlayer: currentPlayer.indexPlayer,
          status: coord.status,
        }),
        id: 0,
      };

      connection1.send(JSON.stringify(response));
      connection2.send(JSON.stringify(response));
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
      connection2.send(JSON.stringify(response));

      updateWinners(currentPlayer.indexPlayer);
      data.currentGames = data.currentGames.filter((game) => game.currentGameId !== currentPlayer.gameId);

      return;
    } else {
      playerTurn(connection1, connection2, currentPlayer.indexPlayer);
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
    connection2.send(JSON.stringify(response));
    playerTurn(connection1, connection2, enemy.indexPlayer);
  }
};

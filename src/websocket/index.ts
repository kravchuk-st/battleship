import { WebSocketServer } from 'ws';
import { data, playerExists, changeData } from 'src/db';
import { ICustomWebSocket, IRequest, IPlayer, IPlayerMatrixForTheGame, IFinishMessage } from 'src/types';

import { updateRoom } from './updateRoom';
import { winnerUpdateResponse } from './updateWinners';
import { handleLogin } from './handleLogin';
import { handleRegistration } from './handleRegistration';
import { handleRoomCreate } from './handleRoomCreate';
import { addUserToRoom } from './addUserToRoom';

const webSocketPort = 3000;

export const wss = new WebSocketServer({
  port: webSocketPort,
});

wss.on('connection', (ws: ICustomWebSocket) => {
  console.log(`A client connected on the ${webSocketPort} webSocketPort`);

  ws.on('message', (message: string) => {
    const request = JSON.parse(message);
    handleRequest(ws, request);
  });

  ws.on('close', () => {
    console.log('A client disconnected');

    let newConnections = data.connections.filter((connection) => connection.index !== ws.index);
    let newUsers = data.roomUsers.filter((room) => room.roomId !== ws.index);

    changeData('connections', newConnections);
    changeData('roomUsers', newUsers);

    updateRoom();
    flawlessWictory(ws);
  });
});

export function handleRequest(ws: ICustomWebSocket, request: IRequest) {
  console.log(request);

  switch (request.type) {
    case 'reg':
      if (playerExists(request)) {
        handleLogin(ws, request);
      } else {
        handleRegistration(ws, request);
      }
      updateRoom();
      winnerUpdateResponse();
      break;
    case 'create_room':
      handleRoomCreate(ws);
      break;
    case 'add_user_to_room':
      addUserToRoom(ws, request);
      break;
  }
}

const flawlessWictory = (ws: ICustomWebSocket) => {
  const isThePlayerWasInTheGame = data.currentGames.find((game) => game.indexPlayer === ws.index);

  if (isThePlayerWasInTheGame) {
    const currentGame = data.currentGames.filter(
      (game) => game.currentGameId === isThePlayerWasInTheGame.currentGameId
    );

    if (currentGame.length === 1) {
      data.currentGames = data.currentGames.filter(
        (game) => game.currentGameId !== isThePlayerWasInTheGame.currentGameId
      );
    } else if (currentGame.length === 2) {
      const playerWhoLeftTheGame = currentGame.find(
        (player) => player.indexPlayer === ws.index
      ) as IPlayerMatrixForTheGame;

      const winnerOfTheGame = currentGame.filter(
        (player) => player.indexPlayer !== playerWhoLeftTheGame.indexPlayer
      )[0];

      data.currentGames = data.currentGames.filter((game) => game.currentGameId !== playerWhoLeftTheGame.currentGameId);

      const connection1 = data.connections.find((ws) => ws.index === winnerOfTheGame.indexPlayer);

      const dataWinPlayer = JSON.stringify({
        winPlayer: winnerOfTheGame.indexPlayer,
      });

      const response: IFinishMessage = {
        type: 'finish',
        data: dataWinPlayer,
        id: 0,
      };

      if (connection1) {
        connection1.send(JSON.stringify(response));
      }

      updateWinners(winnerOfTheGame.indexPlayer);
    }
  } else {
    let currentGamesNew = data.currentGames.filter((game) => game.currentGameId !== ws.index);
    changeData('currentGames', currentGamesNew);
  }
};

export const updateWinners = (id: string) => {
  const winner = data.players.find((player) => player.index === id) as IPlayer;

  data.players = data.players.map((player) => {
    if (player.index === id) {
      return { ...player, wins: (player.wins += 1) };
    }

    return player;
  });

  const isWinnerInTheArray = data.winners.find((player) => player.name === winner.name);

  if (isWinnerInTheArray) {
    data.winners = data.winners.map((player) => {
      if (player.name === winner.name) {
        return { ...player, wins: (player.wins += 1) };
      }
      return player;
    });
  } else {
    data.winners.push(winner);
  }

  winnerUpdateResponse();
};

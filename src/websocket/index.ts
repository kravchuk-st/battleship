import { WebSocketServer } from 'ws';
import { data, playerExists } from 'src/db';
import {
  ICustomWebSocket,
  IRequest,
  IPlayer,
  IPlayerMatrixForTheGame,
  IFinishMessage,
  IAddShipsRequest,
  IAddShipsData,
  IShip,
} from 'src/types';

import { updateRoom } from './updateRoom';
import { winnerUpdateResponse } from './updateWinners';
import { handleLogin } from './handleLogin';
import { handleRegistration } from './handleRegistration';
import { handleRoomCreate } from './handleRoomCreate';
import { addUserToRoom } from './addUserToRoom';
import { createMatrix } from './createMatrix';
import { playerTurn } from './playerTurn';
import { handleAttack } from './handleAttack';
import { handleBotAttack } from './handleBotAttack';
import { isGameWithBot } from './isGameWithBot';
import { playerTurnWithBot } from './playerTurnWithBot';
import { singlePlay } from './singlePlay';

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

    data.connections = data.connections.filter((connection) => connection.index !== ws.index);
    data.roomUsers = data.roomUsers.filter((room) => room.roomId !== ws.index);

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
    case 'add_ships':
      addShips(request);
      break;
    case 'attack':
      isGameWithBot(request) ? handleBotAttack(ws, request, false) : handleAttack(request, false);
      break;
    case 'randomAttack':
      isGameWithBot(request) ? handleBotAttack(ws, request, true) : handleAttack(request, true);
      break;
    case 'single_play':
      singlePlay(ws);
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
    data.currentGames = data.currentGames.filter((game) => game.currentGameId !== ws.index);
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

const addShips = (request: IAddShipsRequest) => {
  const shipsData = JSON.parse(request.data) as IAddShipsData;

  const ships: IShip[] = shipsData.ships;

  const matrix = createMatrix(ships);

  const player: IPlayerMatrixForTheGame = {
    currentGameId: shipsData.gameId,
    ships: matrix,
    indexPlayer: shipsData.indexPlayer,
    turn: false,
  };

  data.currentGames.push(player);

  const currentGame = data.currentGames.filter((game) => game.currentGameId === player.currentGameId);

  if (currentGame.length === 2) {
    const bot1 = data.players.find((player) => player.index === currentGame[0].indexPlayer) as IPlayer;
    const bot2 = data.players.find((player) => player.index === currentGame[1].indexPlayer) as IPlayer;

    if (bot1.name === 'BOT' || bot2?.name === 'BOT') {
      startGameWithBot(currentGame);
    } else {
      startTheGame(currentGame);
    }
  }
};

const startTheGame = (playersInGame: IPlayerMatrixForTheGame[]) => {
  const gameCreator = playersInGame.find(
    (client) => client.indexPlayer === client.currentGameId
  ) as IPlayerMatrixForTheGame;

  const secondPlayer = playersInGame.filter(
    (client) => client.indexPlayer !== gameCreator.indexPlayer && gameCreator.currentGameId === gameCreator.indexPlayer
  )[0];

  const creatorClientData = JSON.stringify({
    ships: gameCreator.ships,
    currentPlayerIndex: gameCreator.indexPlayer,
  });
  const secondPlayerData = JSON.stringify({
    ships: secondPlayer.ships,
    currentPlayerIndex: secondPlayer.indexPlayer,
  });

  const response1 = {
    type: 'start_game',
    data: creatorClientData,
    id: 0,
  };

  const response2 = {
    type: 'start_game',
    data: secondPlayerData,
    id: 0,
  };

  const connection1 = data.connections.find((item) => item.index === gameCreator.indexPlayer) as ICustomWebSocket;

  const connection2 = data.connections.find((item) => item.index === secondPlayer.indexPlayer) as ICustomWebSocket;

  connection1.send(JSON.stringify(response1));
  connection2.send(JSON.stringify(response2));

  gameCreator.turn = true;

  playerTurn(connection1, connection2, gameCreator.indexPlayer);
};

const startGameWithBot = (arrayForGameWithBot: IPlayerMatrixForTheGame[]) => {
  const gameCreator = arrayForGameWithBot.find(
    (client) => client.indexPlayer === client.currentGameId
  ) as IPlayerMatrixForTheGame;

  const creatorClientData = JSON.stringify({
    ships: gameCreator.ships,
    currentPlayerIndex: gameCreator.indexPlayer,
  });

  const response1 = {
    type: 'start_game',
    data: creatorClientData,
    id: 0,
  };

  const connection1 = data.connections.find((item) => item.index === gameCreator.indexPlayer) as ICustomWebSocket;

  connection1.send(JSON.stringify(response1));

  gameCreator.turn = true;

  playerTurnWithBot(connection1, gameCreator.indexPlayer);
};

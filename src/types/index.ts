import { WebSocket } from 'ws';

export interface ICustomWebSocket extends WebSocket {
  index: string;
}

export interface IRoomUsers {
  name: string;
  index: string;
}

export interface IRoom {
  roomId: string;
  roomUsers: IRoomUsers[];
}

export interface IPlayer {
  name: string;
  password: string;
  index: string;
  wins: number;
}

export interface IWinner {
  name: string;
  wins: number;
}

export interface IRequest {
  type: string;
  data: string;
  id: number;
}

export interface IFinishMessage {
  type: 'finish';
  data: string;
  id: number;
}

export interface IIndexRoom {
  indexRoom: string;
}

export type MatrixCells = 'miss' | 'killed' | 'shot' | 'small' | 'medium' | 'large' | 'huge' | 'empty';

export type GameMatrix = MatrixCells[][];

export interface IPlayerMatrixForTheGame {
  currentGameId: string;
  ships: GameMatrix;
  indexPlayer: string;
  turn: boolean;
}

export interface IData {
  players: IPlayer[];
  connections: ICustomWebSocket[];
  roomUsers: IRoom[];
  winners: IWinner[];
  currentGames: IPlayerMatrixForTheGame[];
}

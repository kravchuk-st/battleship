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

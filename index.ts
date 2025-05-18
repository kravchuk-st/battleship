import { httpServer } from './src/http_server/index.js';
import './src/websocket/server.ts';
import 'dotenv/config';

const HTTP_PORT = process.env.PORT || 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

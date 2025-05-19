import 'dotenv/config';
import { httpServer } from './src/http_server';
import './src/websocket';

const HTTP_PORT = process.env.PORT || 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

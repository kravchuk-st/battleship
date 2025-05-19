import { v4 as uuidv4 } from 'uuid';
import { data } from 'src/db';

export const botCreation = () => {
  const botId = uuidv4();

  const newBot = {
    name: 'BOT',
    password: botId,
    index: botId,
    wins: 0,
  };

  data.players.push(newBot);
};

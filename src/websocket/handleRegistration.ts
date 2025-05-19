import { botCreation } from './botCreation';
import { registerPlayer } from 'src/db';
import { ICustomWebSocket, IRequest, IPlayer } from 'src/types';

export function handleRegistration(ws: ICustomWebSocket, request: IRequest) {
  const { name, password }: IPlayer = JSON.parse(request.data);

  const empty = /^\S+$/;

  if (name.length < 5 || password.length < 5) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        error: true,
        errorText: 'Minimum 5 characters',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
  } else if (!empty.test(name) || !empty.test(password)) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        error: true,
        errorText: 'Please note that your password or username should not contain any spaces.',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
  } else {
    const response = registerPlayer(name, password, ws);

    ws.send(JSON.stringify(response));
    botCreation();
  }
}

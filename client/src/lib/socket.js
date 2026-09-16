import { io } from 'socket.io-client';

const SOCKET_URL = 'https://bhoomi-7e7h.onrender.com';

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true
});

export default socket;
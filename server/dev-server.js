import cors from 'cors';
import express from 'express';
import {
  bookRoomsHandler,
  getRoomsHandler,
  randomizeRoomsHandler,
  resetRoomsHandler,
} from './handlers.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/rooms', getRoomsHandler);
app.post('/api/book', bookRoomsHandler);
app.post('/api/randomize', randomizeRoomsHandler);
app.post('/api/reset', resetRoomsHandler);

app.listen(port, () => {
  console.log(`Hotel reservation API listening on port ${port}`);
});
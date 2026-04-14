import { rooms } from '../server/hotel.js';

export default function handler(_request, response) {
  response.status(200).json({ rooms });
}
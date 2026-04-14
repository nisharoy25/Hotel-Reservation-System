import { createRandomOccupancy } from '../server/hotel.js';

export default function handler(_request, response) {
  response.status(200).json({
    occupiedRoomIds: createRandomOccupancy(),
    message: 'Generated a random room occupancy pattern.',
  });
}
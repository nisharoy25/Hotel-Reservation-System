import { createResetPayload } from '../server/hotel.js';

export default function handler(_request, response) {
  response.status(200).json({
    occupiedRoomIds: createResetPayload(),
    message: 'Cleared all room occupancy and bookings.',
  });
}
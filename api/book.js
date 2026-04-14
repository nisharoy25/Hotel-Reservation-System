import { createBookingPayload } from '../server/hotel.js';

export default function handler(request, response) {
  try {
    const roomCount = Number(request.body?.roomCount);
    const occupiedRoomIds = Array.isArray(request.body?.occupiedRoomIds) ? request.body.occupiedRoomIds : [];
    const booking = createBookingPayload(roomCount, occupiedRoomIds);

    response.status(200).json({ booking });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
}
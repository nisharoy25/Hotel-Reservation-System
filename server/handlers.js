import { createBookingPayload, createRandomOccupancy, createResetPayload, rooms } from './hotel.js';

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

export function getRoomsHandler(_request, response) {
  sendJson(response, 200, { rooms });
}

export function bookRoomsHandler(request, response) {
  try {
    const roomCount = Number(request.body?.roomCount);
    const occupiedRoomIds = Array.isArray(request.body?.occupiedRoomIds) ? request.body.occupiedRoomIds : [];
    const booking = createBookingPayload(roomCount, occupiedRoomIds);

    sendJson(response, 200, { booking });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

export function randomizeRoomsHandler(_request, response) {
  sendJson(response, 200, {
    occupiedRoomIds: createRandomOccupancy(),
    message: 'Generated a random room occupancy pattern.',
  });
}

export function resetRoomsHandler(_request, response) {
  sendJson(response, 200, {
    occupiedRoomIds: createResetPayload(),
    message: 'Cleared all room occupancy and bookings.',
  });
}
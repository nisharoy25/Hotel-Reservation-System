const jsonHeaders = {
  'Content-Type': 'application/json',
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: jsonHeaders,
    ...options,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

export function fetchRooms() {
  return request('/api/rooms');
}

export function bookRooms(roomCount, occupiedRoomIds) {
  return request('/api/book', {
    method: 'POST',
    body: JSON.stringify({ roomCount, occupiedRoomIds }),
  });
}

export function randomizeRooms(occupiedRoomIds = []) {
  return request('/api/randomize', {
    method: 'POST',
    body: JSON.stringify({ occupiedRoomIds }),
  });
}

export function resetRooms() {
  return request('/api/reset', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
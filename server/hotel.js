const FLOOR_COUNTS = [10, 10, 10, 10, 10, 10, 10, 10, 10, 7];
const MAX_BOOKING = 5;
const MAX_RANDOM_OCCUPANCY = 70;

function createRooms() {
  const rooms = [];

  FLOOR_COUNTS.forEach((roomCount, floorIndex) => {
    const floor = floorIndex + 1;

    for (let position = 0; position < roomCount; position += 1) {
      const roomNumber = floor === 10 ? 1001 + position : floor * 100 + position + 1;

      rooms.push({
        id: String(roomNumber),
        floor,
        position,
      });
    }
  });

  return rooms;
}

export const rooms = createRooms();

const roomsByFloor = rooms.reduce((map, room) => {
  if (!map.has(room.floor)) {
    map.set(room.floor, []);
  }

  map.get(room.floor).push(room);
  return map;
}, new Map());

function distanceBetween(roomA, roomB) {
  if (roomA.floor === roomB.floor) {
    return Math.abs(roomA.position - roomB.position);
  }

  return roomA.position + roomB.position + Math.abs(roomA.floor - roomB.floor) * 2;
}

function calculateTravelTime(selection) {
  if (selection.length < 2) {
    return 0;
  }

  const sortedSelection = sortRooms(selection);

  return distanceBetween(sortedSelection[0], sortedSelection[sortedSelection.length - 1]);
}

function sortRooms(unsortedRooms) {
  return [...unsortedRooms].sort((left, right) => {
    if (left.floor !== right.floor) {
      return left.floor - right.floor;
    }

    return left.position - right.position;
  });
}

function compareSelections(left, right) {
  if (left.travelTime !== right.travelTime) {
    return left.travelTime - right.travelTime;
  }

  if (left.sameFloor !== right.sameFloor) {
    return left.sameFloor ? -1 : 1;
  }

  if (left.floorSpan !== right.floorSpan) {
    return left.floorSpan - right.floorSpan;
  }

  const leftRooms = left.rooms.map((room) => Number(room.id));
  const rightRooms = right.rooms.map((room) => Number(room.id));
  const compareLength = Math.min(leftRooms.length, rightRooms.length);

  for (let index = 0; index < compareLength; index += 1) {
    if (leftRooms[index] !== rightRooms[index]) {
      return leftRooms[index] - rightRooms[index];
    }
  }

  return leftRooms.length - rightRooms.length;
}

function createSelection(roomsSelection) {
  const sortedSelection = sortRooms(roomsSelection);

  return {
    rooms: sortedSelection,
    travelTime: calculateTravelTime(sortedSelection),
    sameFloor: sortedSelection.every((room) => room.floor === sortedSelection[0].floor),
    floorSpan: sortedSelection[sortedSelection.length - 1].floor - sortedSelection[0].floor,
  };
}

function chooseBestSameFloorBlock(availableRooms, roomCount) {
  let bestSelection = null;

  for (let startIndex = 0; startIndex <= availableRooms.length - roomCount; startIndex += 1) {
    const candidate = createSelection(availableRooms.slice(startIndex, startIndex + roomCount));

    if (!bestSelection || compareSelections(candidate, bestSelection) < 0) {
      bestSelection = candidate;
    }
  }

  return bestSelection;
}

function chooseAcrossFloors(availableRoomsByFloor, roomCount) {
  const selectedRooms = [];
  let remainingRooms = roomCount;

  for (const floor of Array.from(availableRoomsByFloor.keys()).sort((left, right) => left - right)) {
    if (remainingRooms === 0) {
      break;
    }

    const floorRooms = availableRoomsByFloor.get(floor);
    const roomsToTake = Math.min(floorRooms.length, remainingRooms);

    selectedRooms.push(...floorRooms.slice(0, roomsToTake));
    remainingRooms -= roomsToTake;
  }

  if (remainingRooms > 0) {
    return null;
  }

  return createSelection(selectedRooms);
}

export function findBestBooking(roomCount, occupiedRoomIds) {
  if (!Number.isInteger(roomCount) || roomCount < 1 || roomCount > MAX_BOOKING) {
    throw new Error('Room count must be between 1 and 5.');
  }

  const occupiedSet = new Set(occupiedRoomIds);
  const availableRoomsByFloor = new Map();
  let totalAvailable = 0;

  for (const [floor, floorRooms] of roomsByFloor.entries()) {
    const availableRooms = floorRooms.filter((room) => !occupiedSet.has(room.id));
    availableRoomsByFloor.set(floor, availableRooms);
    totalAvailable += availableRooms.length;
  }

  if (totalAvailable < roomCount) {
    throw new Error(`Not enough rooms available. Need ${roomCount}, but only ${totalAvailable} available.`);
  }

  // Priority 1: Check ALL floors for same-floor availability
  let bestSameFloorSelection = null;

  for (const [floor, availableRooms] of availableRoomsByFloor.entries()) {
    if (availableRooms.length < roomCount) {
      continue;
    }

    const candidateSelection = chooseBestSameFloorBlock(availableRooms, roomCount);

    if (!bestSameFloorSelection || compareSelections(candidateSelection, bestSameFloorSelection) < 0) {
      bestSameFloorSelection = candidateSelection;
    }
  }

  if (bestSameFloorSelection) {
    return bestSameFloorSelection;
  }

  // Priority 2: Span across floors starting from earliest floor with availability
  const firstAvailableFloor = Array.from(availableRoomsByFloor.entries())
    .sort((left, right) => left[0] - right[0])
    .find(([, availableRooms]) => availableRooms.length > 0);

  if (!firstAvailableFloor) {
    throw new Error('No available rooms found.');
  }

  const [startingFloor] = firstAvailableFloor;

  const eligibleFloors = new Map(
    Array.from(availableRoomsByFloor.entries()).filter(([floor]) => floor >= startingFloor),
  );

  const bestSelection = chooseAcrossFloors(eligibleFloors, roomCount);

  if (!bestSelection) {
    throw new Error('Unable to find an optimal booking for the requested rooms.');
  }

  return bestSelection;
}

export function createBookingPayload(roomCount, occupiedRoomIds) {
  const booking = findBestBooking(roomCount, occupiedRoomIds);
  const selectedRoomIds = booking.rooms.map((room) => room.id);
  const updatedOccupiedRoomIds = sortRooms(
    rooms.filter((room) => occupiedRoomIds.includes(room.id) || selectedRoomIds.includes(room.id)),
  ).map((room) => room.id);

  return {
    roomIds: selectedRoomIds,
    travelTime: booking.travelTime,
    updatedOccupiedRoomIds,
    message: booking.sameFloor
      ? `Booked ${roomCount} room${roomCount > 1 ? 's' : ''} on floor ${booking.rooms[0].floor}.`
      : `Booked ${roomCount} room${roomCount > 1 ? 's' : ''} across floors with minimum travel time.`,
  };
}

export function createRandomOccupancy() {
  const shuffledRooms = [...rooms].sort(() => Math.random() - 0.5);
  const occupancyCount = Math.floor(Math.random() * (MAX_RANDOM_OCCUPANCY + 1));

  return sortRooms(shuffledRooms.slice(0, occupancyCount)).map((room) => room.id);
}

export function createResetPayload() {
  return [];
}
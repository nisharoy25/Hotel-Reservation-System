import { useEffect, useState } from 'react';
import { bookRooms, fetchRooms, randomizeRooms, resetRooms } from './lib/api';
import { loadState, saveState } from './lib/storage';

const MAX_BOOKING = 5;

function buildRoomLookup(rooms) {
  return new Map(rooms.map((room) => [room.id, room]));
}

function groupRoomsByFloor(rooms) {
  return rooms.reduce((floors, room) => {
    if (!floors.has(room.floor)) {
      floors.set(room.floor, []);
    }

    floors.get(room.floor).push(room);
    return floors;
  }, new Map());
}

function calculateTravelTime(roomIds, roomLookup) {
  if (roomIds.length < 2) {
    return 0;
  }

  const selectedRooms = roomIds
    .map((roomId) => roomLookup.get(roomId))
    .filter(Boolean)
    .sort((left, right) => {
      if (left.floor !== right.floor) {
        return left.floor - right.floor;
      }

      return left.position - right.position;
    });

  if (selectedRooms.length < 2) {
    return 0;
  }

  const firstRoom = selectedRooms[0];
  const lastRoom = selectedRooms[selectedRooms.length - 1];

  if (firstRoom.floor === lastRoom.floor) {
    return Math.abs(firstRoom.position - lastRoom.position);
  }

  return firstRoom.position + lastRoom.position + Math.abs(firstRoom.floor - lastRoom.floor) * 2;
}

export default function App() {
  const persistedState = loadState();
  const [rooms, setRooms] = useState([]);
  const [roomCount, setRoomCount] = useState('');
  const [occupiedRoomIds, setOccupiedRoomIds] = useState(persistedState?.occupiedRoomIds ?? []);
  const [selectedRoomIds, setSelectedRoomIds] = useState(persistedState?.selectedRoomIds ?? []);
  const [pendingRoomIds, setPendingRoomIds] = useState(persistedState?.pendingRoomIds ?? []);
  const [travelTime, setTravelTime] = useState(0);
  const [message, setMessage] = useState('Select up to 5 rooms and book them optimally.');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    fetchRooms()
      .then((payload) => {
        if (!active) {
          return;
        }

        setRooms(payload.rooms);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setMessage('Unable to load rooms.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    saveState({ occupiedRoomIds, selectedRoomIds, pendingRoomIds });
  }, [occupiedRoomIds, pendingRoomIds, selectedRoomIds]);

  const roomLookup = buildRoomLookup(rooms);
  const floors = groupRoomsByFloor(rooms);

  function commitManualSelection() {
    const sortedPendingRoomIds = [...pendingRoomIds].sort((left, right) => Number(left) - Number(right));
    const updatedOccupiedRoomIds = [...new Set([...occupiedRoomIds, ...sortedPendingRoomIds])].sort(
      (left, right) => Number(left) - Number(right),
    );

    setSelectedRoomIds(sortedPendingRoomIds);
    setOccupiedRoomIds(updatedOccupiedRoomIds);
    setPendingRoomIds([]);
    setRoomCount(String(sortedPendingRoomIds.length));
    setTravelTime(calculateTravelTime(sortedPendingRoomIds, roomLookup));
    setMessage(
      `Booked ${sortedPendingRoomIds.length} manually selected room${sortedPendingRoomIds.length > 1 ? 's' : ''}.`,
    );
  }

  function handleRoomClick(roomId) {
    if (loading || submitting || occupiedRoomIds.includes(roomId)) {
      return;
    }

    setSelectedRoomIds([]);
    setTravelTime(0);

    setPendingRoomIds((currentPendingRoomIds) => {
      if (currentPendingRoomIds.includes(roomId)) {
        const nextPendingRoomIds = currentPendingRoomIds.filter((currentRoomId) => currentRoomId !== roomId);
        setRoomCount(nextPendingRoomIds.length > 0 ? String(nextPendingRoomIds.length) : '');
        setMessage(
          nextPendingRoomIds.length > 0
            ? `Manual selection updated: ${nextPendingRoomIds.length} room${nextPendingRoomIds.length > 1 ? 's' : ''} selected.`
            : 'Manual selection cleared. Enter a room count or click rooms to select them.',
        );
        return nextPendingRoomIds;
      }

      if (currentPendingRoomIds.length >= MAX_BOOKING) {
        setMessage('You can manually select up to 5 rooms at a time.');
        return currentPendingRoomIds;
      }

      const nextPendingRoomIds = [...currentPendingRoomIds, roomId].sort((left, right) => Number(left) - Number(right));
      setRoomCount(String(nextPendingRoomIds.length));
      setMessage(`Manual selection ready: ${nextPendingRoomIds.join(', ')}`);
      return nextPendingRoomIds;
    });
  }

  async function handleBook() {
    if (pendingRoomIds.length > 0) {
      const unavailableRooms = pendingRoomIds.filter((roomId) => occupiedRoomIds.includes(roomId));

      if (unavailableRooms.length > 0) {
        setMessage(`Cannot book: rooms ${unavailableRooms.join(', ')} are already occupied.`);
        return;
      }

      commitManualSelection();
      return;
    }

    const parsedCount = Number(roomCount);

    if (!roomCount || roomCount.trim() === '') {
      setMessage('Please enter the number of rooms or click rooms to select manually.');
      return;
    }

    if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > MAX_BOOKING) {
      setMessage('Please enter a whole number between 1 and 5.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = await bookRooms(parsedCount, occupiedRoomIds);

      setSelectedRoomIds(payload.booking.roomIds);
      setPendingRoomIds([]);
      setTravelTime(payload.booking.travelTime);
      setOccupiedRoomIds(payload.booking.updatedOccupiedRoomIds);
      setMessage(payload.booking.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRandomize() {
    setSubmitting(true);

    try {
      const payload = await randomizeRooms(occupiedRoomIds);

      setSelectedRoomIds([]);
      setPendingRoomIds([]);
      setTravelTime(0);
      setOccupiedRoomIds(payload.occupiedRoomIds);
      setMessage(payload.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    setSubmitting(true);

    try {
      const payload = await resetRooms();

      setSelectedRoomIds([]);
      setPendingRoomIds([]);
      setTravelTime(0);
      setOccupiedRoomIds(payload.occupiedRoomIds);
      setRoomCount('');
      setMessage(payload.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="controls">
          <label className="room-input-wrap" htmlFor="room-count">
            <input
              id="room-count"
              className="room-input"
              type="number"
              min="1"
              max="5"
              placeholder="No of Rooms"
              value={roomCount}
              onChange={(event) => setRoomCount(event.target.value)}
              disabled={loading || submitting}
            />
          </label>

          <button className="action-button" type="button" onClick={handleBook} disabled={loading || submitting}>
            Book
          </button>
          <button className="action-button" type="button" onClick={handleReset} disabled={loading || submitting}>
            Reset
          </button>
          <button className="action-button" type="button" onClick={handleRandomize} disabled={loading || submitting}>
            Random
          </button>
        </div>

        <div className="status-bar">
          <p>{message}</p>
          <p>Travel Time: {travelTime} min</p>
        </div>

        <div className="status-bar">
          <p>
            Manual Selection:{' '}
            {pendingRoomIds.length > 0 ? pendingRoomIds.join(', ') : 'None'}
          </p>
          <p>Selected Count: {pendingRoomIds.length}</p>
        </div>

        <div className="building-layout" aria-busy={loading}>
          <div className="stairs-column" aria-hidden="true" />

          <div className="rooms-grid">
            {Array.from(floors.entries())
              .sort((left, right) => left[0] - right[0])
              .map(([floor, floorRooms]) => (
                <div key={floor} className="floor-row">
                  {floorRooms.map((room) => {
                    const occupied = occupiedRoomIds.includes(room.id);
                    const selected = selectedRoomIds.includes(room.id);
                    const pending = pendingRoomIds.includes(room.id);
                    const classes = ['room-cell'];

                    if (occupied) {
                      classes.push('room-cell-occupied');
                    }

                    if (pending) {
                      classes.push('room-cell-pending');
                    }

                    if (selected) {
                      classes.push('room-cell-selected');
                    }

                    return (
                      <button
                        key={room.id}
                        className={classes.join(' ')}
                        type="button"
                        onClick={() => handleRoomClick(room.id)}
                        disabled={loading || submitting || occupied}
                        aria-pressed={pending}
                        title={`${room.id}${selected ? ' - booked now' : pending ? ' - selected manually' : occupied ? ' - occupied' : ' - available'}`}
                      >
                        <span>{room.id}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>

        <div className="legend">
          <span><i className="legend-box legend-box-available" /> Available</span>
          <span><i className="legend-box legend-box-occupied" /> Occupied</span>
          <span><i className="legend-box legend-box-pending" /> Manually Selected</span>
          <span><i className="legend-box legend-box-selected" /> Newly Booked</span>
        </div>

        <div className="summary-card">
          <p>Occupied Rooms: {occupiedRoomIds.length}</p>
          <p>Available Rooms: {Math.max(rooms.length - occupiedRoomIds.length, 0)}</p>
          <p>
            Latest Booking:{' '}
            {selectedRoomIds.length > 0
              ? selectedRoomIds.map((roomId) => roomLookup.get(roomId)?.id ?? roomId).join(', ')
              : 'None'}
          </p>
        </div>
      </section>
    </main>
  );
}
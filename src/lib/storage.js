const STORAGE_KEY = 'hotel-reservation-state';

export function loadState() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);

    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value);

    return {
      occupiedRoomIds: Array.isArray(parsed.occupiedRoomIds) ? parsed.occupiedRoomIds : [],
      selectedRoomIds: Array.isArray(parsed.selectedRoomIds) ? parsed.selectedRoomIds : [],
      pendingRoomIds: Array.isArray(parsed.pendingRoomIds) ? parsed.pendingRoomIds : [],
    };
  } catch {
    return null;
  }
}

export function saveState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
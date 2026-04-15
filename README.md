# Hotel Reservation System

A modern hotel room reservation system built with React and Node.js that optimally allocates rooms to minimize guest travel time between rooms.

## Features

- **Interactive Room Grid**: Visual floor-by-floor display of all hotel rooms
- **Smart Room Allocation**: Automatically finds optimal room combinations that minimize travel time
- **Manual Selection**: Select up to 5 rooms manually or let the system optimize your selection
- **Randomization**: Simulate different occupancy scenarios for testing
- **Persistent State**: Bookings and selections are saved in browser local storage
- **Real-time Updates**: Instant visual feedback on room availability and selections


## Project Structure

```
hotel-reservation-system/
├── api/                    # Vercel serverless API handlers
│   ├── book.js            # POST /api/book - Book rooms
│   ├── rooms.js           # GET /api/rooms - Fetch room data
│   ├── randomize.js       # POST /api/randomize - Randomize occupancy
│   └── reset.js           # POST /api/reset - Reset all bookings
├── server/                # Shared server logic
│   ├── hotel.js           # Core booking algorithm and room data
│   ├── handlers.js        # Express route handlers
│   └── dev-server.js      # Local development Express server
├── src/                   # React frontend
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # React entry point
│   ├── styles.css         # Application styles
│   └── lib/
│       ├── api.js         # API client functions
│       └── storage.js     # Local storage utilities
├── index.html             # HTML entry point
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── vercel.json            # Vercel deployment configuration
```

## Development

```bash
# Start both frontend and backend development servers
npm run dev

# Or run them separately:
npm run dev:client  # Frontend on http://localhost:5173
npm run dev:server  # Backend on http://localhost:3001
```

The frontend automatically proxies `/api` requests to the Express development server on port 3001.



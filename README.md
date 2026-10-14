# Deadline Scheduler

Deadline management system with Telegram bot integration and interactive web calendar interface.

## Features

- 📅 **Interactive Calendar** - Drag-and-drop deadlines with FullCalendar
- 🤖 **Telegram Bot** - Manage deadlines via Telegram commands
- ⚡ **Priority System** - High/Medium/Low priority levels with color coding
- 🔔 **Smart Reminders** - Automated notifications for upcoming deadlines
- 🔐 **JWT Authentication** - Secure Telegram-based authentication
- 📊 **Real-time Updates** - Seamless sync between bot and web interface

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **aiogram 3.x** - Telegram Bot framework
- **APScheduler** - Background job scheduling
- **python-jose** - JWT token handling

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **FullCalendar** - Interactive calendar component
- **Axios** - HTTP client

## Architecture

```
deadline-scheduler/
├── backend/
│   ├── app/
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── api/            # REST API endpoints
│   │   ├── auth/           # JWT authentication
│   │   └── database.py     # Database configuration
│   ├── bot/
│   │   ├── handlers/       # Telegram command handlers
│   │   └── keyboards/      # Inline keyboards
│   ├── scheduler/          # APScheduler jobs
│   ├── main.py             # FastAPI application
│   ├── bot.py              # Telegram bot runner
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api/            # API client
│   │   ├── types.ts        # TypeScript types
│   │   └── App.tsx         # Main application
│   └── package.json
└── docker-compose.yml
```

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 20+
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))

### 1. Clone Repository

```bash
git clone https://github.com/Davydoff-D/deadline-scheduler.git
cd deadline-scheduler
```

### 2. Environment Variables

Create `.env` in project root:

```bash
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token_here

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production-use-long-random-string

# Database
DATABASE_URL=sqlite:///./deadline_scheduler.db

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Server
HOST=0.0.0.0
PORT=8000
```

Create `frontend/.env.local`:

```bash
VITE_API_URL=http://localhost:8000
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python main.py
```

Backend will be available at `http://localhost:8000`

API documentation at `http://localhost:8000/docs`

### 4. Start Telegram Bot

In a separate terminal:

```bash
cd backend
source venv/bin/activate
python bot.py
```

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Docker Setup

Run everything with Docker Compose:

```bash
# Create .env file first (see step 2 above)

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- Telegram Bot: running in background

## Usage

### Telegram Bot Commands

- `/start` - Initialize bot and show main menu
- Add deadline through interactive dialog
- View today's deadlines
- View week's deadlines
- Mark deadlines as completed
- Delete deadlines

### Web Interface

1. Open `http://localhost:5173`
2. Click any date on calendar to create deadline
3. Drag deadlines to reschedule
4. Click deadline to view details/complete/delete
5. View upcoming deadlines in sidebar

## API Endpoints

### Authentication

- `POST /auth/telegram` - Authenticate with Telegram
- `POST /auth/verify-token` - Verify JWT token
- `GET /auth/me` - Get current user

### Deadlines

- `GET /deadlines` - List all deadlines
- `POST /deadlines` - Create deadline
- `GET /deadlines/{id}` - Get deadline
- `PUT /deadlines/{id}` - Update deadline
- `DELETE /deadlines/{id}` - Delete deadline

### Health

- `GET /health` - Health check endpoint

## Database Schema

### User
- `id` - Primary key
- `telegram_id` - Telegram user ID (unique)
- `username` - Telegram username
- `first_name` - First name
- `last_name` - Last name
- `is_active` - Active status
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### Deadline
- `id` - Primary key
- `user_id` - Foreign key to User
- `category_id` - Foreign key to Category (optional)
- `title` - Deadline title
- `description` - Optional description
- `due_date` - Deadline date/time
- `priority` - Priority level (low/medium/high)
- `is_completed` - Completion status
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### Category
- `id` - Primary key
- `user_id` - Foreign key to User
- `name` - Category name
- `color` - Color hex code
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

## Scheduler Jobs

- **Upcoming Deadline Check** - Runs every 5 minutes, checks for deadlines in next hour
- **Daily Summary** - Runs at 09:00, sends summary of tomorrow's deadlines

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate

# Run with auto-reload
uvicorn main:app --reload

# Run linter
ruff check .

# Format code
ruff format .
```

### Frontend Development

```bash
cd frontend

# Development server with HMR
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Bot not responding
- Check `BOT_TOKEN` in `.env`
- Verify bot is running: `ps aux | grep bot.py`
- Check logs for errors

### Database errors
- Delete `deadline_scheduler.db` to reset
- Backend will recreate on next start

### Frontend cannot connect to backend
- Verify backend is running on port 8000
- Check `VITE_API_URL` in `frontend/.env.local`
- Check CORS configuration in `backend/main.py`

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Support

For issues and questions, open an issue on GitHub: https://github.com/Davydoff-D/deadline-scheduler/issues

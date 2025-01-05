# Year Calendar View

A full-stack application that displays a yearly view of your Google Calendar events, built with Python FastAPI backend and React frontend.

## Features

- Google OAuth2 authentication
- Select from available Google Calendars
- Yearly calendar view with event indicators
- Modern and responsive UI
- Secure backend handling of Google Calendar API

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with your credentials:
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
SECRET_KEY=your_secret_key_here
```

5. Start the backend server:
```bash
uvicorn app.main:app --reload
```

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Google Cloud Setup

1. Create a project in Google Cloud Console
2. Enable the Google Calendar API
3. Configure the OAuth consent screen
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:5174`
6. Add authorized redirect URIs:
   - `http://localhost:8000/api/v1/auth/callback`

## Technologies Used

### Backend
- FastAPI (Python web framework)
- Google OAuth2 and Calendar API
- JWT for token management
- Pydantic for data validation
- Uvicorn for ASGI server

### Frontend
- React
- TypeScript
- Vite
- Styled Components
- date-fns

## Development

The project is structured as a monorepo with separate backend and frontend directories:

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   └── requirements.txt
└── frontend/
    ├── src/
    ├── public/
    └── package.json
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

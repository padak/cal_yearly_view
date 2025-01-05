# Year Calendar View

A full-stack application that displays a yearly view of your Google Calendar events, built with Python FastAPI backend and React frontend.

## Features

- Google OAuth2 authentication
- Select from available Google Calendars
- Yearly calendar view with event indicators
- Color-coded events for different company meetings:
  - Townhall (Yellow)
  - Monthly Business Planning (Green)
  - Leadership AMA (Red)
  - Other events (Blue)
- Modern and responsive UI
- Secure backend handling of Google Calendar API

## Environment Setup

Before running the application, you need to set up your environment variables:

1. Set up backend environment:
```bash
cp backend/.env.example backend/.env
```
Then edit `backend/.env` to add:
- Your Google OAuth credentials (client ID and secret)
- A secure random string for the SECRET_KEY
- Other configuration options as needed

2. Set up frontend environment:
```bash
cp frontend/.env.example frontend/.env
```
Then edit `frontend/.env` to add your Google OAuth Client ID.

## Running Tests

### Using Docker (Recommended)

Once you have the Docker containers running, you can run the backend tests using:
```bash
docker exec -e PYTHONPATH=/app calendar-backend pytest
```

This will run all tests and show the test coverage report. The tests are run inside the Docker container, so you don't need a local Python environment.

## Deployment Options

### 1. Docker Deployment (Recommended)

The easiest way to run the application is using Docker:

1. Clone the repository:
```bash
git clone https://github.com/padak/cal_yearly_view.git
cd cal_yearly_view
```

2. Set up environment files as described in the Environment Setup section above.

3. Build and run with Docker Compose:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

### 2. Manual Setup

#### Backend Setup

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

4. Start the backend server:
```bash
uvicorn app.main:app --reload
```

#### Frontend Setup

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
6. Add authorized redirect URIs:
   - `http://localhost:8000/api/v1/auth/callback`

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

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

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development Notes

- The application uses environment variables for configuration. Make sure to set up your `.env` file correctly.
- For development, you can run the backend and frontend separately.
- For production, use the Docker deployment option for better consistency and ease of deployment.

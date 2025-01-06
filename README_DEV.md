# Developer Documentation

This document provides technical details and development guidelines for the Year Calendar View application.

## Architecture Overview

The application is built using a modern stack:

### Backend (FastAPI)
- `app/api/endpoints.py`: Main API routes and handlers
- `app/services/google_calendar.py`: Google Calendar integration service
- `app/core/config.py`: Application configuration and settings
- `app/main.py`: FastAPI application setup and middleware

### Frontend (React + TypeScript)
- `src/components/YearCalendar.tsx`: Main calendar component
- `src/services/googleCalendar.ts`: API client for backend integration
- Styled Components for styling
- date-fns for date manipulation

## Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js (for local frontend development)
- Python 3.11+ (for local backend development)
- Google Cloud Console account

### Local Development

1. Backend (Python FastAPI):
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

2. Frontend (React):
```bash
cd frontend
npm install
npm run dev
```

### Docker Development

Run both services:
```bash
docker-compose up --build
```

Individual services:
```bash
# Backend only
docker-compose up backend

# Frontend only
docker-compose up frontend
```

## Testing

### Backend Tests
```bash
# Using Docker
docker exec -e PYTHONPATH=/app calendar-backend pytest

# Local development
cd backend
PYTHONPATH=. pytest
```

Current test coverage:
- Overall: 87%
- endpoints.py: 79%
- google_calendar.py: 91%

### Frontend Tests
```bash
cd frontend
npm test
```

## API Documentation

### Authentication Endpoints

#### GET /api/v1/auth/url
- Returns Google OAuth authorization URL
- No authentication required

#### GET /api/v1/auth/callback
- Handles OAuth callback
- Query Parameters:
  - code: OAuth authorization code

### Calendar Endpoints

#### GET /api/v1/calendars
- Lists available Google Calendars
- Requires authentication token

#### GET /api/v1/calendars/{calendar_id}/events
- Gets events for a specific calendar
- Parameters:
  - calendar_id: Google Calendar ID
  - year: Year to fetch events for
- Requires authentication token

## Environment Variables

### Backend (.env)
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/callback
SECRET_KEY=your_secure_random_string
API_V1_STR=/api/v1
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_GOOGLE_CLIENT_ID=your_client_id
```

## Code Style Guidelines

### Python (Backend)
- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Handle exceptions appropriately

### TypeScript (Frontend)
- Use TypeScript interfaces for props and state
- Follow React functional component patterns
- Use styled-components for styling
- Document complex components

## Deployment

### Production Deployment
1. Update environment variables for production
2. Build Docker images:
```bash
docker-compose -f docker-compose.prod.yml build
```
3. Run containers:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Google Cloud Setup
1. Create project in Google Cloud Console
2. Enable Google Calendar API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add authorized origins and redirect URIs

## Common Issues and Solutions

### OAuth Issues
- Ensure redirect URIs match exactly
- Check OAuth consent screen configuration
- Verify client ID and secret in environment variables

### Docker Issues
- Clear Docker cache if builds fail
- Check port conflicts
- Ensure environment variables are set

### Test Coverage
- Missing coverage in endpoints.py error handlers
- Consider adding tests for:
  - Invalid JWT token handling
  - Generic error cases in endpoints
  - Calendar service error scenarios

## Contributing Guidelines

1. Create feature branch from main
2. Write tests for new features
3. Ensure all tests pass
4. Update documentation
5. Submit pull request

## Security Notes

- Never commit .env files
- Keep OAuth credentials secure
- Regularly update dependencies
- Use secure random string for SECRET_KEY
- Implement rate limiting in production 
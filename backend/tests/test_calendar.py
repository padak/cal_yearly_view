import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from app.main import app
from datetime import datetime, timezone

client = TestClient(app)

@pytest.mark.asyncio
@patch("app.api.endpoints.get_credentials_from_token")
@patch("app.services.google_calendar.get_calendar_service")
async def test_list_calendars_success(mock_get_service, mock_get_credentials):
    """Test successful retrieval of calendar list."""
    # Mock credentials
    mock_credentials = {
        "token": "test_token",
        "refresh_token": "test_refresh_token",
        "token_uri": "https://oauth2.googleapis.com/token",
        "scopes": ["https://www.googleapis.com/auth/calendar.readonly"]
    }
    mock_get_credentials.return_value = mock_credentials

    # Mock calendar service response
    mock_service = Mock()
    mock_calendar_list = {
        "items": [
            {
                "id": "calendar1",
                "summary": "Test Calendar 1",
                "timeZone": "UTC"
            },
            {
                "id": "calendar2",
                "summary": "Test Calendar 2",
                "timeZone": "UTC"
            }
        ]
    }
    mock_service.calendarList().list().execute.return_value = mock_calendar_list
    mock_get_service.return_value = mock_service

    response = client.get(
        "/api/v1/calendars",
        params={"token": "test_token"}
    )
    
    assert response.status_code == 200
    calendars = response.json()
    assert len(calendars) == 2
    assert calendars[0]["id"] == "calendar1"
    assert calendars[1]["summary"] == "Test Calendar 2"

@pytest.mark.asyncio
async def test_list_calendars_unauthorized():
    """Test calendar list retrieval without authorization."""
    response = client.get("/api/v1/calendars")
    assert response.status_code == 422  # Validation error for missing token

@pytest.mark.asyncio
@patch("app.api.endpoints.get_credentials_from_token")
@patch("app.services.google_calendar.get_calendar_service")
async def test_get_calendar_events_success(mock_get_service, mock_get_credentials):
    """Test successful retrieval of calendar events."""
    # Mock credentials
    mock_credentials = {
        "token": "test_token",
        "refresh_token": "test_refresh_token",
        "token_uri": "https://oauth2.googleapis.com/token",
        "scopes": ["https://www.googleapis.com/auth/calendar.readonly"]
    }
    mock_get_credentials.return_value = mock_credentials

    # Mock calendar service response
    mock_service = Mock()
    mock_events = {
        "items": [
            {
                "id": "event1",
                "summary": "Test Event 1",
                "start": {"dateTime": "2024-01-01T10:00:00Z"},
                "end": {"dateTime": "2024-01-01T11:00:00Z"}
            },
            {
                "id": "event2",
                "summary": "Test Event 2",
                "start": {"date": "2024-01-02"},
                "end": {"date": "2024-01-03"}
            }
        ]
    }
    mock_service.events().list().execute.return_value = mock_events
    mock_get_service.return_value = mock_service

    response = client.get(
        "/api/v1/calendars/test_calendar_id/events",
        params={
            "token": "test_token",
            "year": 2024
        }
    )
    
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 2
    assert events[0]["id"] == "event1"
    assert events[1]["summary"] == "Test Event 2"

@pytest.mark.asyncio
async def test_get_calendar_events_invalid_dates():
    """Test calendar events retrieval with invalid date parameters."""
    response = client.get(
        "/api/v1/calendars/test_calendar_id/events",
        params={
            "token": "test_token",
            "year": "invalid_year"
        }
    )
    assert response.status_code == 422  # Validation error for invalid year

@pytest.mark.asyncio
@patch("app.api.endpoints.get_credentials_from_token")
@patch("app.services.google_calendar.get_calendar_service")
async def test_get_calendar_events_service_error(mock_get_service, mock_get_credentials):
    """Test handling of service errors when retrieving calendar events."""
    # Mock credentials
    mock_credentials = {
        "token": "test_token",
        "refresh_token": "test_refresh_token",
        "token_uri": "https://oauth2.googleapis.com/token",
        "scopes": ["https://www.googleapis.com/auth/calendar.readonly"]
    }
    mock_get_credentials.return_value = mock_credentials

    # Mock service error
    mock_service = Mock()
    mock_service.events().list().execute.side_effect = Exception("API Error")
    mock_get_service.return_value = mock_service

    response = client.get(
        "/api/v1/calendars/test_calendar_id/events",
        params={
            "token": "test_token",
            "year": 2024
        }
    )
    
    assert response.status_code == 500
    assert "error" in response.json() 
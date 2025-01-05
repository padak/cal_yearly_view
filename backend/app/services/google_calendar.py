from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from typing import List, Dict, Any

from ..core.config import get_settings

settings = get_settings()


def create_oauth_flow() -> Flow:
    """Create OAuth 2.0 flow instance to manage the OAuth 2.0 Authorization Grant Flow."""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
            }
        },
        scopes=settings.GOOGLE_AUTH_SCOPES,
    )
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    return flow


def get_calendar_service(credentials: Dict[str, Any]):
    """Create Google Calendar API service instance."""
    creds = Credentials(
        token=credentials.get("token"),
        refresh_token=credentials.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=settings.GOOGLE_AUTH_SCOPES,
    )
    return build("calendar", "v3", credentials=creds)


async def list_calendars(credentials: Dict[str, Any]) -> List[Dict[str, Any]]:
    """List available calendars for the authenticated user."""
    service = get_calendar_service(credentials)
    calendar_list = service.calendarList().list().execute()
    return calendar_list.get("items", [])


async def get_calendar_events(
    credentials: Dict[str, Any], calendar_id: str, time_min: str, time_max: str
) -> List[Dict[str, Any]]:
    """Get events for a specific calendar within a time range."""
    service = get_calendar_service(credentials)
    events_result = (
        service.events()
        .list(
            calendarId=calendar_id,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    return events_result.get("items", []) 
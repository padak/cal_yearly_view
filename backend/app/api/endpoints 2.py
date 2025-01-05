from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from typing import Dict, List
import json
from datetime import datetime
from jose import JWTError, jwt
from oauthlib.oauth2.rfc6749.errors import OAuth2Error

from ..core.config import get_settings
from ..services.google_calendar import (
    create_oauth_flow,
    list_calendars,
    get_calendar_events,
)

settings = get_settings()
router = APIRouter()


def create_access_token(data: dict) -> str:
    """Create a JWT token containing the credentials."""
    return jwt.encode(data, settings.SECRET_KEY, algorithm="HS256")


def get_credentials_from_token(token: str) -> Dict:
    """Decode JWT token to get credentials."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


@router.get("/auth/url")
async def get_auth_url():
    """Get the Google OAuth authorization URL."""
    flow = create_oauth_flow()
    auth_url, _ = flow.authorization_url(prompt="consent")
    return {"url": auth_url}


@router.get("/auth/callback")
async def auth_callback(code: str):
    """Handle the OAuth callback and exchange code for tokens."""
    try:
        flow = create_oauth_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Create a token containing the credentials
        token_data = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "scopes": credentials.scopes,
        }
        access_token = create_access_token(token_data)

        # Redirect to frontend with the token
        return RedirectResponse(
            url=f"{settings.BACKEND_CORS_ORIGINS[0]}?token={access_token}",
            status_code=307
        )
    except OAuth2Error as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )


@router.get("/calendars")
async def get_calendars(token: str) -> List[Dict]:
    """Get list of available calendars."""
    try:
        credentials = get_credentials_from_token(token)
        return await list_calendars(credentials)
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@router.get("/calendars/{calendar_id}/events")
async def get_events(calendar_id: str, year: int, token: str) -> List[Dict]:
    """Get events for a specific calendar and year."""
    try:
        credentials = get_credentials_from_token(token)
        time_min = datetime(year, 1, 1).isoformat() + "Z"
        time_max = datetime(year, 12, 31, 23, 59, 59).isoformat() + "Z"
        return await get_calendar_events(credentials, calendar_id, time_min, time_max)
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        ) 
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from app.main import app
from app.core.config import get_settings
from oauthlib.oauth2.rfc6749.errors import OAuth2Error
from httpx import AsyncClient

client = TestClient(app)
settings = get_settings()

def test_get_auth_url():
    """Test getting the Google OAuth authorization URL."""
    response = client.get(f"{settings.API_V1_STR}/auth/url")
    assert response.status_code == 200
    assert "url" in response.json()
    assert "accounts.google.com" in response.json()["url"]

@pytest.mark.asyncio
@patch("app.services.google_calendar.Flow")
async def test_auth_callback_success(mock_flow_class):
    """Test successful OAuth callback."""
    # Mock the Flow class
    mock_flow = Mock()
    mock_flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    # Create a mock credentials object that will be returned after fetch_token
    mock_credentials = Mock()
    mock_credentials.token = "test_token"
    mock_credentials.refresh_token = "test_refresh_token"
    mock_credentials.token_uri = "https://oauth2.googleapis.com/token"
    mock_credentials.scopes = ["https://www.googleapis.com/auth/calendar.readonly"]
    
    # Set up the fetch_token method to accept kwargs
    def mock_fetch_token(**kwargs):
        mock_flow.credentials = mock_credentials
        return {
            "access_token": "test_token",
            "refresh_token": "test_refresh_token",
            "token_type": "Bearer",
            "expires_in": 3600,
            "scope": ["https://www.googleapis.com/auth/calendar.readonly"]
        }
    
    mock_flow.fetch_token = Mock(side_effect=mock_fetch_token)
    mock_flow_class.from_client_config.return_value = mock_flow

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get(f"{settings.API_V1_STR}/auth/callback", params={"code": "test_code"})
        assert response.status_code == 307  # Redirect status code
        assert settings.BACKEND_CORS_ORIGINS[0] in response.headers["location"]
        assert "token=" in response.headers["location"]

@pytest.mark.asyncio
async def test_auth_callback_missing_code():
    """Test OAuth callback without code parameter."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get(f"{settings.API_V1_STR}/auth/callback")
        assert response.status_code == 422  # Validation error

@pytest.mark.asyncio
@patch("app.services.google_calendar.Flow")
async def test_auth_callback_invalid_code(mock_flow_class):
    """Test OAuth callback with invalid code."""
    # Mock the OAuth flow to raise an exception
    mock_flow = Mock()
    mock_flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    mock_flow.fetch_token = Mock(side_effect=lambda **kwargs: (_ for _ in ()).throw(OAuth2Error("Invalid code")))
    mock_flow_class.from_client_config.return_value = mock_flow

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get(f"{settings.API_V1_STR}/auth/callback", params={"code": "invalid_code"})
        assert response.status_code == 400  # Bad request
        assert "error" in response.json() 
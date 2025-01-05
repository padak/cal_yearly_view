import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import YearCalendar from './components/YearCalendar';
import CalendarSelector from './components/CalendarSelector';
import { getAuthUrl, handleCallback, initializeGoogleApi, fetchCalendarList } from './services/googleCalendar';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: #333;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  margin: 10px 0;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
`;

const LoginButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #357abd;
  }
`;

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [calendars, setCalendars] = useState<gapi.client.calendar.CalendarListEntry[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthentication = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      try {
        if (token) {
          // Handle direct token from backend redirect
          console.log('Received token from backend');
          await handleLoginSuccess(token);
        } else if (code && state) {
          // Handle OAuth callback
          console.log('Handling OAuth callback');
          const newToken = await handleCallback(code, state);
          await handleLoginSuccess(newToken);
        } else {
          // Check for stored token
          console.log('Checking stored token');
          const storedToken = localStorage.getItem('accessToken');
          if (storedToken) {
            setIsSignedIn(true);
          }
        }
        // Clean up URL regardless of the path taken
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error: any) {
        console.error('Authentication error:', error);
        setError('Failed to complete authentication. Please try again.');
        handleLogout();
      }
    };

    handleAuthentication();
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      loadCalendars();
    }
  }, [isSignedIn]);

  const loadCalendars = async () => {
    try {
      setError(null);
      const calendarList = await fetchCalendarList();
      if (calendarList && calendarList.length > 0) {
        setCalendars(calendarList);
      } else {
        setError('No calendars found. Make sure you have access to Google Calendar.');
      }
    } catch (error: any) {
      console.error('Error loading calendars:', error);
      if (error.response?.status === 401) {
        handleLogout();
        setError('Authentication expired. Please sign in again.');
      } else {
        const errorMessage = error.response?.data?.error?.message || 'Failed to load calendars. Please check your permissions and try again.';
        setError(errorMessage);
      }
    }
  };

  const handleLoginSuccess = async (token: string) => {
    try {
      setError(null);
      await initializeGoogleApi(token);
      setIsSignedIn(true);
    } catch (error: any) {
      console.error('Error initializing Google API:', error);
      setError('Failed to initialize Google API. Please try again.');
      handleLogout();
    }
  };

  const handleLogin = async () => {
    try {
      const authUrl = await getAuthUrl();
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Error getting auth URL:', error);
      setError('Failed to start login process. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsSignedIn(false);
    setCalendars([]);
    setSelectedCalendar(null);
    setError(null);
    localStorage.removeItem('accessToken');
  };

  return (
    <AppContainer>
      <Header>
        <Title>Year Calendar View</Title>
        {isSignedIn ? (
          <button onClick={handleLogout}>Sign Out</button>
        ) : (
          <LoginButton onClick={handleLogin}>
            Sign in with Google
          </LoginButton>
        )}
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isSignedIn && (
        <>
          <CalendarSelector
            calendars={calendars}
            selectedCalendar={selectedCalendar}
            onSelectCalendar={setSelectedCalendar}
          />
          {selectedCalendar && (
            <YearCalendar
              calendarId={selectedCalendar}
              year={new Date().getFullYear()}
            />
          )}
        </>
      )}
    </AppContainer>
  );
}

export default App;

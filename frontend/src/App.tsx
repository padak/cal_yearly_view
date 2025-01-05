import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout, CredentialResponse } from '@react-oauth/google';
import styled from 'styled-components';
import { format } from 'date-fns';
import YearCalendar from './components/YearCalendar';
import CalendarSelector from './components/CalendarSelector';
import { fetchCalendarList, initializeGoogleApi } from './services/googleCalendar';

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

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [calendars, setCalendars] = useState<gapi.client.calendar.CalendarListEntry[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a token on mount
    const token = localStorage.getItem('googleToken');
    if (token) {
      setIsSignedIn(true);
    }
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
      if (calendarList.items && calendarList.items.length > 0) {
        setCalendars(calendarList.items);
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

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError(null);
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      console.log('Login successful, attempting to initialize API');
      await initializeGoogleApi(credentialResponse.credential);
      setIsSignedIn(true);
    } catch (error: any) {
      console.error('Error initializing Google API:', error);
      setError('Failed to initialize Google API. Please try again.');
      handleLogout();
    }
  };

  const handleLogout = () => {
    googleLogout();
    setIsSignedIn(false);
    setCalendars([]);
    setSelectedCalendar(null);
    setError(null);
    localStorage.removeItem('googleToken');
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AppContainer>
        <Header>
          <Title>Year Calendar View</Title>
          {isSignedIn ? (
            <button onClick={handleLogout}>Sign Out</button>
          ) : (
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => {
                console.error('Login failed');
                setError('Login failed. Please try again.');
              }}
              useOneTap={false}
              type="standard"
              theme="filled_blue"
              size="large"
              text="continue_with"
              shape="rectangular"
              logo_alignment="center"
            />
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
    </GoogleOAuthProvider>
  );
}

export default App;

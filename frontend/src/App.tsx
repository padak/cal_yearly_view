import { useState, useEffect } from 'react';
import styled from 'styled-components';
import YearCalendar from './components/YearCalendar';
import { getAuthUrl, handleCallback, initializeGoogleApi } from './services/googleCalendar';

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

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
`;

const RefreshButton = styled(LoginButton)`
  background-color: #66bb6a;
  
  &:hover {
    background-color: #4caf50;
  }
`;

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const currentYear = new Date().getFullYear();
  const companyCalendarId = 'c_ba5823068ccdac7f2c41a7879a126e2ffaf181ac78411eb2446fb577e1982860@group.calendar.google.com';

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
            await handleLoginSuccess(storedToken);
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
    setError(null);
    localStorage.removeItem('accessToken');
  };

  const handleRefresh = () => {
    setKey(prevKey => prevKey + 1);
  };

  return (
    <AppContainer>
      <Header>
        <Title>Keboola Company Calendar - Year View</Title>
        {isSignedIn ? (
          <ButtonGroup>
            <LoginButton onClick={handleLogout}>Sign Out</LoginButton>
            <RefreshButton onClick={handleRefresh}>
              Refresh Calendar
            </RefreshButton>
          </ButtonGroup>
        ) : (
          <LoginButton onClick={handleLogin}>
            Sign in with Google
          </LoginButton>
        )}
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isSignedIn && (
        <YearCalendar 
          key={key}
          calendarId={companyCalendarId} 
          year={currentYear} 
        />
      )}
    </AppContainer>
  );
}

export default App;

import axios from 'axios';

export const initializeGoogleApi = async (credential: string) => {
  if (!credential) {
    throw new Error('No credential provided');
  }
  console.log('Initializing with credential length:', credential.length);
  localStorage.setItem('googleToken', credential);
};

const getAccessToken = () => {
  const token = localStorage.getItem('googleToken');
  if (!token) throw new Error('Not authenticated');
  return token;
};

export const fetchCalendarList = async () => {
  try {
    const token = getAccessToken();
    console.log('Fetching calendar list...'); // Debug log

    const response = await axios({
      method: 'get',
      url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      validateStatus: (status) => {
        return status < 500; // Resolve only if the status code is less than 500
      }
    });

    if (response.status === 401) {
      console.error('401 Unauthorized - Full response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
      });
      localStorage.removeItem('googleToken');
      throw new Error('Authentication expired');
    }

    if (!response.data) {
      throw new Error('No data received from Google Calendar API');
    }
    
    console.log('Calendar response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Detailed error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
    });
    throw error;
  }
};

export const fetchEvents = async (calendarId: string, timeMin: string, timeMax: string) => {
  try {
    const token = getAccessToken();

    const response = await axios({
      method: 'get',
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      params: {
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      },
      validateStatus: (status) => {
        return status < 500; // Resolve only if the status code is less than 500
      }
    });

    if (response.status === 401) {
      console.error('401 Unauthorized - Full response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
      });
      localStorage.removeItem('googleToken');
      throw new Error('Authentication expired');
    }

    if (!response.data) {
      throw new Error('No data received from Google Calendar API');
    }

    return response.data;
  } catch (error: any) {
    console.error('Detailed error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
    });
    throw error;
  }
}; 
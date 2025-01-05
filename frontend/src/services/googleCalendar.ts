import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const getAuthUrl = async (): Promise<string> => {
  try {
    console.log('Getting auth URL from:', `${API_BASE_URL}/auth/url`);
    const response = await axiosInstance.get('/auth/url');
    return response.data.url;
  } catch (error: any) {
    console.error('Error getting auth URL:', {
      message: error.message,
      response: error.response?.data,
      baseURL: API_BASE_URL,
    });
    throw error;
  }
};

export const handleCallback = async (code: string, state: string): Promise<string> => {
  try {
    console.log('Handling callback with:', {
      url: `${API_BASE_URL}/auth/callback`,
      code,
      state,
    });
    const response = await axiosInstance.get('/auth/callback', {
      params: { code, state }
    });
    console.log('Callback response:', response.data);
    return response.data.access_token;
  } catch (error: any) {
    console.error('Error handling callback:', {
      message: error.message,
      response: error.response?.data,
      baseURL: API_BASE_URL,
    });
    throw error;
  }
};

export const initializeGoogleApi = async (token: string) => {
  if (!token) {
    throw new Error('No token provided');
  }
  localStorage.setItem('accessToken', token);
};

export const fetchCalendarList = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await axiosInstance.get('/calendars', {
      params: { token },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching calendars:', {
      message: error.message,
      response: error.response?.data,
      baseURL: API_BASE_URL,
    });
    throw error;
  }
};

export const fetchEvents = async (calendarId: string, timeMin: string, timeMax: string) => {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await axiosInstance.get(`/calendars/${calendarId}/events`, {
      params: {
        token,
        year: new Date(timeMin).getFullYear(),
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching events:', {
      message: error.message,
      response: error.response?.data,
      baseURL: API_BASE_URL,
    });
    throw error;
  }
}; 
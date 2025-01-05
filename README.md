# Year Calendar View

A React application that displays a yearly view of your Google Calendar events.

## Features

- Google OAuth2 authentication
- Select from available Google Calendars
- Yearly calendar view with event indicators
- Modern and responsive UI

## Setup

1. Clone the repository:
```bash
git clone https://github.com/padak/cal_yearly_view.git
cd cal_yearly_view
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Google OAuth Client ID:
```
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

4. Start the development server:
```bash
npm run dev
```

## Google Cloud Setup

1. Create a project in Google Cloud Console
2. Enable the Google Calendar API
3. Configure the OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:5174`

## Technologies Used

- React
- TypeScript
- Vite
- Google OAuth2
- Google Calendar API
- Styled Components
- date-fns

## Development

This project uses:
- Vite for fast development and building
- TypeScript for type safety
- React for UI components
- Styled Components for styling
- date-fns for date manipulation

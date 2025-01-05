import styled from 'styled-components';

const Select = styled.select`
  padding: 8px;
  font-size: 16px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 400px;
`;

interface CalendarSelectorProps {
  calendars: gapi.client.calendar.CalendarListEntry[];
  selectedCalendar: string | null;
  onSelectCalendar: (calendarId: string) => void;
}

const CalendarSelector = ({ calendars, selectedCalendar, onSelectCalendar }: CalendarSelectorProps) => {
  return (
    <Select
      value={selectedCalendar || ''}
      onChange={(e) => onSelectCalendar(e.target.value)}
    >
      <option value="">Select a calendar</option>
      {calendars.map((calendar) => (
        <option key={calendar.id} value={calendar.id}>
          {calendar.summary}
        </option>
      ))}
    </Select>
  );
};

export default CalendarSelector; 
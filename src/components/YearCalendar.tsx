import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format, startOfYear, endOfYear, eachMonthOfInterval, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { fetchEvents } from '../services/googleCalendar';

const CalendarContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
`;

const MonthContainer = styled.div`
  border: 1px solid #ddd;
  padding: 10px;
`;

const MonthTitle = styled.h3`
  margin: 0 0 10px 0;
  text-align: center;
`;

const WeekDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  margin-bottom: 5px;
`;

const Days = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const Day = styled.div<{ isCurrentMonth: boolean; hasEvents: boolean }>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background-color: ${props => props.hasEvents ? '#e3f2fd' : 'transparent'};
  color: ${props => props.isCurrentMonth ? '#333' : '#ccc'};
  position: relative;

  &:hover {
    background-color: ${props => props.hasEvents ? '#bbdefb' : '#f5f5f5'};
  }
`;

interface YearCalendarProps {
  calendarId: string;
  year: number;
}

interface Event {
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  summary: string;
}

const YearCalendar = ({ calendarId, year }: YearCalendarProps) => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchYearEvents = async () => {
      const yearStart = startOfYear(new Date(year, 0));
      const yearEnd = endOfYear(new Date(year, 0));
      
      try {
        const response = await fetchEvents(
          calendarId,
          yearStart.toISOString(),
          yearEnd.toISOString()
        );
        setEvents(response.items || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchYearEvents();
  }, [calendarId, year]);

  const months = eachMonthOfInterval({
    start: new Date(year, 0),
    end: new Date(year, 11)
  });

  const hasEventsOnDay = (date: Date) => {
    return events.some(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date || '');
      return isSameDay(date, eventStart);
    });
  };

  return (
    <CalendarContainer>
      {months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const firstDayOfMonth = monthStart.getDay();

        return (
          <MonthContainer key={month.toString()}>
            <MonthTitle>{format(month, 'MMMM')}</MonthTitle>
            <WeekDays>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </WeekDays>
            <Days>
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <Day key={`empty-${index}`} isCurrentMonth={false} hasEvents={false} />
              ))}
              {days.map(day => (
                <Day
                  key={day.toString()}
                  isCurrentMonth={true}
                  hasEvents={hasEventsOnDay(day)}
                >
                  {format(day, 'd')}
                </Day>
              ))}
            </Days>
          </MonthContainer>
        );
      })}
    </CalendarContainer>
  );
};

export default YearCalendar; 
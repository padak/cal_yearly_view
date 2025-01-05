import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { fetchEvents } from '../services/googleCalendar';

const CalendarContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px;
`;

const MonthContainer = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
`;

const MonthTitle = styled.h2`
  font-size: 1.2em;
  color: #333;
  margin: 0 0 10px 0;
  text-align: center;
`;

const WeekdayHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 0.8em;
  color: #666;
  text-align: center;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

interface DayProps {
  $isCurrentMonth: boolean;
  $hasEvents: boolean;
}

const Day = styled.div<DayProps>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  color: ${props => props.$isCurrentMonth ? '#333' : '#ccc'};
  background-color: ${props => props.$hasEvents ? '#e3f2fd' : 'transparent'};
  border-radius: 4px;
  cursor: ${props => props.$hasEvents ? 'pointer' : 'default'};

  &:hover {
    background-color: ${props => props.$hasEvents ? '#bbdefb' : 'transparent'};
  }
`;

interface YearCalendarProps {
  calendarId: string;
  year: number;
}

function YearCalendar({ calendarId, year }: YearCalendarProps) {
  const [events, setEvents] = useState<{ [date: string]: boolean }>({});

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const timeMin = new Date(year, 0, 1).toISOString();
        const timeMax = new Date(year, 11, 31, 23, 59, 59).toISOString();
        const eventsList = await fetchEvents(calendarId, timeMin, timeMax);
        
        // Create a map of dates with events
        const eventDates = eventsList.reduce((acc: { [date: string]: boolean }, event: any) => {
          const date = event.start.date || event.start.dateTime.split('T')[0];
          acc[date] = true;
          return acc;
        }, {});
        
        setEvents(eventDates);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, [calendarId, year]);

  const renderMonth = (monthIndex: number) => {
    const monthStart = startOfMonth(new Date(year, monthIndex));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add padding days at the start
    const firstDayOfWeek = monthStart.getDay();
    const paddingDays = Array(firstDayOfWeek).fill(null);

    // Add padding days at the end
    const lastDayOfWeek = monthEnd.getDay();
    const endPaddingDays = Array(6 - lastDayOfWeek).fill(null);

    return (
      <MonthContainer key={monthIndex}>
        <MonthTitle>{format(monthStart, 'MMMM')}</MonthTitle>
        <WeekdayHeader>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </WeekdayHeader>
        <DaysGrid>
          {[...paddingDays, ...days, ...endPaddingDays].map((day, index) => {
            if (!day) {
              return <Day key={index} $isCurrentMonth={false} $hasEvents={false} />;
            }
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasEvents = events[dateStr] || false;
            return (
              <Day
                key={dateStr}
                $isCurrentMonth={isSameMonth(day, monthStart)}
                $hasEvents={hasEvents}
                title={hasEvents ? 'Events on this day' : undefined}
              >
                {format(day, 'd')}
              </Day>
            );
          })}
        </DaysGrid>
      </MonthContainer>
    );
  };

  return (
    <CalendarContainer>
      {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
    </CalendarContainer>
  );
}

export default YearCalendar; 
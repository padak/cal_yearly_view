import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { fetchEvents } from '../services/googleCalendar';

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 20px;
`;

const QuarterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const QuarterTitle = styled.h2`
  font-size: 1.4em;
  color: #333;
  margin: 0;
  padding: 0 10px;
`;

const QuarterMonths = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
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
  $eventType: 'townhall' | 'planning' | 'ama' | 'other' | 'none';
}

const Day = styled.div<DayProps>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  color: ${props => props.$isCurrentMonth ? '#333' : '#ccc'};
  background-color: ${props => {
    switch (props.$eventType) {
      case 'townhall':
        return '#fff9c4'; // Light yellow
      case 'planning':
        return '#c8e6c9'; // Light green
      case 'ama':
        return '#ffcdd2'; // Light red
      case 'other':
        return '#e3f2fd'; // Light blue (default)
      default:
        return 'transparent';
    }
  }};
  border-radius: 4px;
  cursor: ${props => props.$eventType !== 'none' ? 'pointer' : 'default'};
  position: relative;

  &:hover {
    background-color: ${props => {
      switch (props.$eventType) {
        case 'townhall':
          return '#fff176'; // Darker yellow
        case 'planning':
          return '#a5d6a7'; // Darker green
        case 'ama':
          return '#ef9a9a'; // Darker red
        case 'other':
          return '#bbdefb'; // Darker blue
        default:
          return 'transparent';
      }
    }};
  }
`;

const EventTooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 200px;
  display: none;
  white-space: nowrap;

  ${Day}:hover & {
    display: block;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Event = styled.div`
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const EventTime = styled.div`
  font-size: 0.9em;
  color: #666;
  display: inline-block;
  margin-right: 8px;
`;

const EventTitle = styled.span`
  color: #333;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #666;

  &:hover {
    color: #333;
  }
`;

const Legend = styled.div`
  display: flex;
  gap: 20px;
  margin: 20px 0;
  justify-content: center;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ColorBox = styled.div<{ $color: string; $hoverColor: string }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${props => props.$color};
  border: 1px solid #e0e0e0;
`;

interface YearCalendarProps {
  calendarId: string;
  year: number;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    date?: string;
    dateTime?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
  };
}

function YearCalendar({ calendarId, year }: YearCalendarProps) {
  const [events, setEvents] = useState<{ [date: string]: CalendarEvent[] }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const timeMin = new Date(year, 0, 1).toISOString();
        const timeMax = new Date(year, 11, 31, 23, 59, 59).toISOString();
        const eventsList = await fetchEvents(calendarId, timeMin, timeMax);
        console.log('Received events:', eventsList);
        
        if (!Array.isArray(eventsList)) {
          console.error('Events list is not an array:', eventsList);
          return;
        }
        
        // Create a map of dates with events
        const eventsByDate = eventsList.reduce((acc: { [date: string]: CalendarEvent[] }, event: CalendarEvent) => {
          const date = event.start.date || event.start.dateTime?.split('T')[0];
          if (date) {
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(event);
          }
          return acc;
        }, {});
        
        setEvents(eventsByDate);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, [calendarId, year]);

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.date) {
      return 'All day';
    }
    const startTime = new Date(event.start.dateTime!);
    const endTime = new Date(event.end.dateTime!);
    return `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
  };

  const renderEventTooltip = (dateEvents: CalendarEvent[]) => {
    return (
      <EventTooltip>
        {dateEvents.slice(0, 3).map((event, index) => (
          <div key={event.id}>
            {event.summary}
            {index < 2 && dateEvents.length > 1 && <hr />}
          </div>
        ))}
        {dateEvents.length > 3 && (
          <div>{dateEvents.length - 3} more events...</div>
        )}
      </EventTooltip>
    );
  };

  const getEventType = (events: CalendarEvent[]) => {
    if (events.length === 0) return 'none';
    
    const eventTitles = events.map(e => e.summary.toLowerCase());
    
    if (eventTitles.some(title => title.includes('townhall') || title.includes('town hall'))) {
      return 'townhall';
    }
    if (eventTitles.some(title => title.includes('monthly business planning'))) {
      return 'planning';
    }
    if (eventTitles.some(title => title.includes('leadership ama'))) {
      return 'ama';
    }
    return 'other';
  };

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
              return <Day key={index} $isCurrentMonth={false} $eventType="none" />;
            }
            const dateStr = format(day, 'yyyy-MM-dd');
            const dateEvents = events[dateStr] || [];
            const eventType = getEventType(dateEvents);
            
            return (
              <Day
                key={dateStr}
                $isCurrentMonth={isSameMonth(day, monthStart)}
                $eventType={eventType}
                onClick={() => eventType !== 'none' && setSelectedDate(dateStr)}
              >
                {format(day, 'd')}
                {dateEvents.length > 0 && renderEventTooltip(dateEvents)}
              </Day>
            );
          })}
        </DaysGrid>
      </MonthContainer>
    );
  };

  const cleanDescription = (description?: string) => {
    if (!description) return '';
    // Remove HTML tags and decode HTML entities
    return description
      .replace(/<[^>]*>/g, '')  // Remove HTML tags
      .replace(/&[^;]+;/g, ' '); // Replace HTML entities with space
  };

  const legendItems = [
    { label: 'Townhall', color: '#fff9c4', hoverColor: '#fff176' },
    { label: 'Monthly Business Planning', color: '#c8e6c9', hoverColor: '#a5d6a7' },
    { label: 'Leadership AMA', color: '#ffcdd2', hoverColor: '#ef9a9a' },
    { label: 'Other Events', color: '#e3f2fd', hoverColor: '#bbdefb' },
  ];

  const renderQuarter = (quarterIndex: number) => {
    const quarterStart = quarterIndex * 3;
    const quarterName = `Q${quarterIndex + 1}`;
    const months = Array.from({ length: 3 }, (_, i) => renderMonth(quarterStart + i));

    return (
      <QuarterContainer key={quarterIndex}>
        <QuarterTitle>{quarterName}</QuarterTitle>
        <QuarterMonths>
          {months}
        </QuarterMonths>
      </QuarterContainer>
    );
  };

  return (
    <>
      <Legend>
        {legendItems.map(item => (
          <LegendItem key={item.label}>
            <ColorBox $color={item.color} $hoverColor={item.hoverColor} />
            <span>{item.label}</span>
          </LegendItem>
        ))}
      </Legend>

      <CalendarContainer>
        {Array.from({ length: 4 }, (_, i) => renderQuarter(i))}
      </CalendarContainer>

      {selectedDate && events[selectedDate] && (
        <Modal onClick={() => setSelectedDate(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h2>{format(new Date(selectedDate), 'MMMM d, yyyy')}</h2>
            <CloseButton onClick={() => setSelectedDate(null)}>&times;</CloseButton>
            <EventList>
              {events[selectedDate].map(event => (
                <Event key={event.id}>
                  <EventTime>{formatEventTime(event)}</EventTime>
                  <EventTitle>{event.summary}</EventTitle>
                </Event>
              ))}
            </EventList>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default YearCalendar; 
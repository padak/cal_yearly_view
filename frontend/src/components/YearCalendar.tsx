import { useState, useEffect, MouseEvent } from 'react';
import styled from 'styled-components';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
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

interface StyledDayProps {
  $isCurrentMonth: boolean;
  $eventType: 'townhall' | 'planning' | 'ama' | 'other' | 'none';
  $isToday: boolean;
  $isWeekend: boolean;
  $isHoliday: boolean;
  $holidayFlags: string;
  $hasCollision: boolean;
}

const Day = styled.div<StyledDayProps>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  color: ${(props: StyledDayProps) => {
    if (!props.$isCurrentMonth) return '#ccc';
    if (props.$isWeekend || props.$isHoliday) return '#999'; // Darker text for weekends and holidays
    return '#333';
  }};
  background-color: ${(props: StyledDayProps) => {
    if (props.$isToday) {
      return '#ffeb3b'; // Bright yellow for today
    }
    if (props.$isWeekend || props.$isHoliday) {
      return '#e0e0e0'; // Darker grey for weekends and holidays
    }
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
  cursor: ${(props: StyledDayProps) => {
    if (props.$isWeekend || props.$isHoliday) return 'not-allowed'; // Change cursor for weekends and holidays
    return props.$eventType !== 'none' ? 'pointer' : 'default';
  }};
  position: relative;
  ${(props: StyledDayProps) => props.$hasCollision && `
    border: 2px solid #ef5350;
  `}
  ${(props: StyledDayProps) => props.$isToday && `
    border: 2px solid #ffc107;
    font-weight: bold;
  `}
  ${(props: StyledDayProps) => (props.$isWeekend || props.$isHoliday) && `
    font-style: italic;
    &::after {
      content: '${props.$isHoliday ? '★' : '✧'}';
      position: absolute;
      bottom: 2px;
      right: 2px;
      font-size: 0.7em;
      opacity: 0.5;
    }
  `}
  ${(props: StyledDayProps) => props.$isHoliday && props.$holidayFlags && `
    &::before {
      content: '${props.$holidayFlags}';
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 0.7em;
    }
  `}

  &:hover {
    background-color: ${(props: StyledDayProps) => {
      if (props.$isToday) {
        return '#ffd740'; // Darker yellow for today hover
      }
      if (props.$isWeekend || props.$isHoliday) {
        return '#bdbdbd'; // Even darker grey for weekend and holiday hover
      }
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
  min-width: 150px;
  display: none;
  white-space: nowrap;

  ${Day}:hover & {
    display: block;
  }
`;

const TooltipTitle = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
  color: #666;
`;

const TooltipContent = styled.div`
  color: #333;
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
  position: relative;
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
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
  align-items: center;
`;

const LegendColors = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HolidayToggles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding: 12px;
  border-radius: 4px;
  background-color: #f5f5f5;
`;

const HolidayToggleItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  label {
    cursor: pointer;
    user-select: none;
    flex: 1;
  }
`;

const HolidayCount = styled.span`
  background-color: #e0e0e0;
  color: #666;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8em;
  min-width: 20px;
  text-align: center;
  margin-right: 8px;
`;

const CollisionCount = styled.span`
  background-color: #ef5350;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8em;
  min-width: 20px;
  text-align: center;
  cursor: help;
  position: relative;

  &:hover .collision-details {
    display: block;
  }
`;

const CollisionTooltip = styled.div`
  display: none;
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 5px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 200px;
  white-space: nowrap;
  color: #333;
  text-align: left;
  font-weight: normal;
`;

interface CollisionDetails {
  [country: string]: {
    dates: string[];
    events: { date: string; holiday: string; eventCount: number }[];
  };
}

const ColorBox = styled.div<{ $color: string; $hoverColor: string }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${props => props.$color};
  border: 1px solid #e0e0e0;
`;

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

interface YearCalendarProps {
  calendarId: string;
  year: number;
}

interface HolidayCalendar {
  id: string;
  name: string;
  enabled: boolean;
  code: string;
  flag: string;
}

function YearCalendar({ calendarId, year }: YearCalendarProps) {
  const [events, setEvents] = useState<{ [date: string]: CalendarEvent[] }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [holidayDates, setHolidayDates] = useState<{ [country: string]: Set<string> }>({});
  const [holidayEvents, setHolidayEvents] = useState<{ [date: string]: (CalendarEvent & { calendarId: string })[] }>({});
  const [holidayCalendars, setHolidayCalendars] = useState<HolidayCalendar[]>([
    { id: 'en.uk%23holiday@group.v.calendar.google.com', name: 'UK', code: 'UK', flag: '🇬🇧', enabled: true },
    { id: 'cs.czech%23holiday@group.v.calendar.google.com', name: 'Czech Republic', code: 'CZ', flag: '🇨🇿', enabled: false },
    { id: 'sk.slovak%23holiday@group.v.calendar.google.com', name: 'Slovakia', code: 'SK', flag: '🇸🇰', enabled: false },
    { id: 'en.usa%23holiday@group.v.calendar.google.com', name: 'USA', code: 'US', flag: '🇺🇸', enabled: false },
    { id: 'en.canadian%23holiday@group.v.calendar.google.com', name: 'Canada', code: 'CA', flag: '🇨🇦', enabled: false },
  ]);
  const [collisions, setCollisions] = useState<{ [country: string]: number }>({});
  const [collisionDetails, setCollisionDetails] = useState<CollisionDetails>({});
  const [holidayWorkdayCounts, setHolidayWorkdayCounts] = useState<{ [country: string]: number }>({});

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const timeMin = new Date(year, 0, 1).toISOString();
        const timeMax = new Date(year, 11, 31, 23, 59, 59).toISOString();
        
        // Load regular events
        const eventsList = await fetchEvents(calendarId, timeMin, timeMax);
        
        // Load holidays for each enabled calendar
        const newHolidayDates: { [country: string]: Set<string> } = {};
        const newHolidayEvents: { [date: string]: (CalendarEvent & { calendarId: string })[] } = {};
        
        for (const calendar of holidayCalendars.filter(cal => cal.enabled)) {
          const holidaysList = await fetchEvents(calendar.id, timeMin, timeMax);
          
          if (Array.isArray(holidaysList)) {
            newHolidayDates[calendar.name] = new Set<string>();
            holidaysList.forEach(event => {
              const date = event.start.date || event.start.dateTime?.split('T')[0];
              if (date) {
                newHolidayDates[calendar.name].add(date);
                if (!newHolidayEvents[date]) {
                  newHolidayEvents[date] = [];
                }
                newHolidayEvents[date].push({ ...event, calendarId: calendar.id });
              }
            });
          }
        }
        
        setHolidayDates(newHolidayDates);
        setHolidayEvents(newHolidayEvents);

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
  }, [calendarId, year, holidayCalendars]);

  useEffect(() => {
    const calculateCollisions = () => {
      const newCollisions: { [country: string]: number } = {};
      const newCollisionDetails: CollisionDetails = {};
      
      // Calculate collisions for each country's holidays
      Object.entries(holidayDates).forEach(([country, dates]) => {
        let collisionCount = 0;
        const countryCollisions: { date: string; holiday: string; eventCount: number }[] = [];
        const collisionDates: string[] = [];
        
        dates.forEach(date => {
          const eventCount = events[date]?.length || 0;
          if (eventCount > 0) {
            collisionCount++;
            collisionDates.push(date);
            const holiday = holidayEvents[date]?.find(e => getCountryFromCalendarId(e.calendarId)?.name === country);
            if (holiday) {
              countryCollisions.push({
                date,
                holiday: holiday.summary,
                eventCount
              });
            }
          }
        });
        
        if (collisionCount > 0) {
          newCollisions[country] = collisionCount;
          newCollisionDetails[country] = {
            dates: collisionDates,
            events: countryCollisions
          };
        }
      });
      
      setCollisions(newCollisions);
      setCollisionDetails(collisionDetails => ({
        ...collisionDetails,
        ...newCollisionDetails
      }));
    };

    calculateCollisions();
  }, [events, holidayDates, holidayEvents]);

  useEffect(() => {
    const calculateHolidayWorkdays = () => {
      const newHolidayWorkdayCounts: { [country: string]: number } = {};
      
      Object.entries(holidayDates).forEach(([country, dates]) => {
        let workdayCount = 0;
        dates.forEach(date => {
          const dayOfWeek = new Date(date).getDay();
          // Only count if it's not a weekend (0 = Sunday, 6 = Saturday)
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workdayCount++;
          }
        });
        newHolidayWorkdayCounts[country] = workdayCount;
      });
      
      setHolidayWorkdayCounts(newHolidayWorkdayCounts);
    };

    calculateHolidayWorkdays();
  }, [holidayDates]);

  const toggleHolidayCalendar = (calendarId: string) => {
    setHolidayCalendars(prevCalendars =>
      prevCalendars.map(cal =>
        cal.id === calendarId ? { ...cal, enabled: !cal.enabled } : cal
      )
    );
  };

  const isHolidayDate = (dateStr: string): boolean => {
    return Object.values(holidayDates).some(dates => dates.has(dateStr));
  };

  const getHolidayNames = (dateStr: string): string[] => {
    const holidays = holidayEvents[dateStr] || [];
    return holidays.map(event => `${event.summary} (${getCountryFromCalendarId(event.calendarId)})`);
  };

  const getCountryFromCalendarId = (calendarId: string): HolidayCalendar | undefined => {
    return holidayCalendars.find(cal => cal.id === calendarId);
  };

  const getHolidayFlags = (dateStr: string): string => {
    const holidays = holidayEvents[dateStr] || [];
    const uniqueFlags = new Set(
      holidays.map(event => {
        const country = getCountryFromCalendarId(event.calendarId);
        return country?.flag || '';
      }).filter(Boolean)
    );
    return Array.from(uniqueFlags).join(' ');
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.date) {
      return 'All day';
    }
    const startTime = new Date(event.start.dateTime!);
    const endTime = new Date(event.end.dateTime!);
    return `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
  };

  const renderEventTooltip = (dateEvents: CalendarEvent[], isWeekend: boolean, isHoliday: boolean, dateStr: string) => {
    if (isWeekend) {
      return (
        <EventTooltip>
          <TooltipTitle>Non-working Day</TooltipTitle>
          <TooltipContent>This is a weekend ({dateEvents.length > 0 ? `${dateEvents.length} events scheduled` : 'no events'})</TooltipContent>
        </EventTooltip>
      );
    }

    if (isHoliday) {
      const holidays = holidayEvents[dateStr] || [];
      return (
        <EventTooltip>
          <TooltipTitle>Holiday</TooltipTitle>
          <TooltipContent>
            {holidays.map((event, index) => {
              const country = getCountryFromCalendarId(event.calendarId);
              return (
                <div key={index}>
                  {country?.flag} [{country?.code}] {event.summary}
                </div>
              );
            })}
            {dateEvents.length > 0 && (
              <div style={{ marginTop: '4px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                {dateEvents.length} event{dateEvents.length > 1 ? 's' : ''} scheduled
              </div>
            )}
          </TooltipContent>
        </EventTooltip>
      );
    }

    if (dateEvents.length > 0) {
      return (
        <EventTooltip>
          <TooltipTitle>Events</TooltipTitle>
          <TooltipContent>
            {dateEvents.slice(0, 3).map((event: CalendarEvent) => (
              <div key={event.id}>
                {event.summary}
                {dateEvents.length > 1 && <hr />}
              </div>
            ))}
            {dateEvents.length > 3 && (
              <div>{dateEvents.length - 3} more events...</div>
            )}
          </TooltipContent>
        </EventTooltip>
      );
    }

    return null;
  };

  const getEventType = (events: CalendarEvent[]): 'townhall' | 'planning' | 'ama' | 'other' | 'none' => {
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

  const hasCollision = (dateStr: string, dateEvents: CalendarEvent[]): boolean => {
    return isHolidayDate(dateStr) && dateEvents.length > 0;
  };

  const renderMonth = (monthIndex: number) => {
    const monthStart = startOfMonth(new Date(year, monthIndex));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Adjust first day to be Monday (1) instead of Sunday (0)
    const firstDayOfWeek = monthStart.getDay();
    const paddingDays = Array(firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1).fill(null);

    // Adjust last day to account for Monday start
    const lastDayOfWeek = monthEnd.getDay();
    const endPaddingDays = Array(lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek).fill(null);

    return (
      <MonthContainer key={monthIndex}>
        <MonthTitle>{format(monthStart, 'MMMM')}</MonthTitle>
        <WeekdayHeader>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} style={{ color: day === 'Sat' || day === 'Sun' ? '#999' : '#666' }}>{day}</div>
          ))}
        </WeekdayHeader>
        <DaysGrid>
          {[...paddingDays, ...days, ...endPaddingDays].map((day, index) => {
            if (!day) {
              return <Day key={index} $isCurrentMonth={false} $eventType="none" $isToday={false} $isWeekend={false} $isHoliday={false} $holidayFlags="" $hasCollision={false} />;
            }
            const dateStr = format(day, 'yyyy-MM-dd');
            const dateEvents = events[dateStr] || [];
            const eventType = getEventType(dateEvents);
            const dayOfWeek = day.getDay();
            const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
            const isHoliday = isHolidayDate(dateStr);
            const holidayFlags = isHoliday ? getHolidayFlags(dateStr) : '';
            const dayHasCollision = hasCollision(dateStr, dateEvents);
            
            return (
              <Day
                key={dateStr}
                $isCurrentMonth={isSameMonth(day, monthStart)}
                $eventType={eventType}
                $isToday={isToday(day)}
                $isWeekend={isWeekend}
                $isHoliday={isHoliday}
                $holidayFlags={holidayFlags}
                $hasCollision={dayHasCollision}
                onClick={() => !isWeekend && !isHoliday && eventType !== 'none' && setSelectedDate(dateStr)}
              >
                {format(day, 'd')}
                {renderEventTooltip(dateEvents, isWeekend, isHoliday, dateStr)}
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

  const formatCollisionDate = (date: string, holiday: string, eventCount: number) => {
    return `${format(new Date(date), 'MMM d')} - ${holiday} (${eventCount} event${eventCount > 1 ? 's' : ''})`;
  };

  return (
    <>
      <Legend>
        <LegendColors>
          {legendItems.map(item => (
            <LegendItem key={item.label}>
              <ColorBox $color={item.color} $hoverColor={item.hoverColor} />
              <span>{item.label}</span>
            </LegendItem>
          ))}
        </LegendColors>
        <HolidayToggles>
          {holidayCalendars.map(calendar => (
            <HolidayToggleItem key={calendar.id}>
              <input
                type="checkbox"
                id={calendar.id}
                checked={calendar.enabled}
                onChange={() => toggleHolidayCalendar(calendar.id)}
              />
              <label htmlFor={calendar.id}>
                {calendar.flag} Show {calendar.name} Holidays
              </label>
              {calendar.enabled && (
                <>
                  <HolidayCount>
                    {holidayWorkdayCounts[calendar.name] || 0} workday holidays
                  </HolidayCount>
                  {collisions[calendar.name] > 0 && (
                    <CollisionCount>
                      {collisions[calendar.name]}
                      <CollisionTooltip className="collision-details">
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          Collisions with events:
                        </div>
                        {collisionDetails[calendar.name]?.events.map((collision, index) => (
                          <div key={index}>
                            {formatCollisionDate(collision.date, collision.holiday, collision.eventCount)}
                          </div>
                        ))}
                      </CollisionTooltip>
                    </CollisionCount>
                  )}
                </>
              )}
            </HolidayToggleItem>
          ))}
        </HolidayToggles>
      </Legend>

      <CalendarContainer>
        {Array.from({ length: 4 }, (_, i) => renderQuarter(i))}
      </CalendarContainer>

      {selectedDate && events[selectedDate] && (
        <Modal onClick={() => setSelectedDate(null)}>
          <ModalContent onClick={(e: MouseEvent) => e.stopPropagation()}>
            <h2>{format(new Date(selectedDate), 'MMMM d, yyyy')}</h2>
            <CloseButton onClick={() => setSelectedDate(null)}>&times;</CloseButton>
            <EventList>
              {events[selectedDate].map((event: CalendarEvent) => (
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
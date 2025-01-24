// Add error boundary
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export default function CalendarView({ entries }) {
  // Add null check
  if (!entries) return <div>Loading calendar...</div>;

  const events = entries.map(entry => ({
    title: `${entry.mood} entry`, // Simplify title
    start: new Date(entry.date),
    end: new Date(entry.date),
    allDay: true
  }));

  return (
    <div style={{ height: 500, padding: '20px' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
      />
    </div>
  );
}
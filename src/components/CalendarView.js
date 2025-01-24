import React from 'react';
import PropTypes from 'prop-types';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Typography, CircularProgress } from '@mui/material';

moment.locale('en');
const localizer = momentLocalizer(moment);

const CalendarView = ({ entries, isLoading }) => {
  // Handle loading and empty states
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography variant="h6">
          No entries found 📅
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start journaling to see your mood calendar
        </Typography>
      </Box>
    );
  }

  // Safely create events
  const events = entries.reduce((acc, entry) => {
    try {
      const date = new Date(entry.date);
      if (!isNaN(date.getTime())) {
        acc.push({
          title: `${entry.mood?.toUpperCase() || 'Entry'}`,
          start: date,
          end: date,
          allDay: true,
        });
      }
    } catch (error) {
      console.error('Error parsing entry date:', error);
    }
    return acc;
  }, []);

  return (
    <Box sx={{ 
      height: '70vh',
      padding: 3,
      '& .rbc-calendar': {
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 1
      }
    }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        style={{ height: '100%' }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: getMoodColor(event.title),
            borderRadius: '4px',
            border: 'none'
          }
        })}
      />
    </Box>
  );
};

// Helper function for mood colors
const getMoodColor = (mood) => {
  const colors = {
    HAPPY: '#FFD700',
    SAD: '#4682B4',
    ANGRY: '#DC143C',
    ANXIOUS: '#808080',
    NEUTRAL: '#32CD32'
  };
  return colors[mood.toUpperCase()] || '#3182CE';
};

// Prop validation
CalendarView.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      mood: PropTypes.string
    })
  ),
  isLoading: PropTypes.bool
};

export default CalendarView;
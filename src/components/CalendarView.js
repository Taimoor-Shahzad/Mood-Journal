import React from 'react';
import PropTypes from 'prop-types';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Typography, CircularProgress, Button, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

moment.locale('en');
const localizer = momentLocalizer(moment);

const CalendarView = ({ entries, isLoading }) => {
  // Custom Toolbar Component
  const CustomToolbar = ({ label, onNavigate }) => (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 2,
      p: 2,
      background: 'linear-gradient(135deg, #667eea30 0%, #764ba230 100%)',
      borderRadius: '16px'
    }}>
      <IconButton onClick={() => onNavigate('PREV')} sx={{ color: '#667eea' }}>
        <ChevronLeft />
      </IconButton>
      <Typography variant="h6" sx={{ 
        fontWeight: 600,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {label}
      </Typography>
      <IconButton onClick={() => onNavigate('NEXT')} sx={{ color: '#667eea' }}>
        <ChevronRight />
      </IconButton>
    </Box>
  );

  // Loading State
  if (isLoading) {
    return (
      <Box sx={{
        height: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.8)',
        borderRadius: '24px'
      }}>
        <CircularProgress sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  // Empty State
  if (!entries || entries.length === 0) {
    return (
      <Box sx={{
        height: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)',
        borderRadius: '24px',
        p: 4
      }}>
        <Typography variant="h5" sx={{ 
          mb: 2,
          fontWeight: 600,
          color: '#667eea'
        }}>
          No Entries Yet 🌈
        </Typography>
        <Typography variant="body1" sx={{ 
          color: '#666',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          Your mood journey starts here! Add entries to see your emotional landscape.
        </Typography>
      </Box>
    );
  }

  // Event Generator with Error Handling
  const events = entries.reduce((acc, entry) => {
    try {
      const date = new Date(entry.date);
      if (!isNaN(date.getTime())) {
        acc.push({
          title: `${entry.mood?.toUpperCase() || 'ENTRY'}`,
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
      p: 3,
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
      '& .rbc-calendar': {
        border: 'none',
        borderRadius: '16px',
        overflow: 'hidden'
      },
      '& .rbc-month-view, & .rbc-time-view': {
        border: 'none'
      },
      '& .rbc-header': {
        background: '#f8fafc',
        padding: '12px',
        fontWeight: 600,
        color: '#667eea'
      },
      '& .rbc-day-bg + .rbc-day-bg': {
        borderLeft: '1px solid #f0f0f0'
      }
    }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        components={{ toolbar: CustomToolbar }}
        eventPropGetter={(event) => ({
          style: {
            background: getMoodColor(event.title),
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: 'white',
            fontWeight: 500,
            padding: '4px 8px'
          }
        })}
        dayPropGetter={(date) => ({
          style: {
            background: events.some(e => 
              moment(e.start).isSame(date, 'day')
            ) ? '#f8fafc' : 'white',
            borderBottom: '1px solid #f0f0f0'
          }
        })}
      />
    </Box>
  );
};

// Enhanced Mood Color System with Gradients
const getMoodColor = (mood) => {
  const gradients = {
    HAPPY: 'linear-gradient(135deg, #FFD700 0%, #FFB347 100%)',
    SAD: 'linear-gradient(135deg, #4682B4 0%, #5F9EA0 100%)',
    ANGRY: 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    ANXIOUS: 'linear-gradient(135deg, #808080 0%, #A9A9A9 100%)',
    NEUTRAL: 'linear-gradient(135deg, #32CD32 0%, #90EE90 100%)'
  };
  return gradients[mood.toUpperCase()] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
};

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
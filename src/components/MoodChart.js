import React from 'react';
import PropTypes from 'prop-types';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Box, Typography, CircularProgress } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend);

const getMoodColor = (mood) => {
  const colors = {
    happy: '#FFD700',
    sad: '#4682B4',
    angry: '#DC143C',
    anxious: '#808080',
    neutral: '#32CD32'
  };
  return colors[mood.toLowerCase()] || '#3182CE';
};

export default function MoodChart({ entries, isLoading }) {
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
          No entries to display 📊
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start journaling to see your mood distribution
        </Typography>
      </Box>
    );
  }

  const moodCounts = entries.reduce((acc, entry) => {
    const mood = entry.mood?.toLowerCase() || 'unknown';
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(moodCounts).map(mood => 
      mood.charAt(0).toUpperCase() + mood.slice(1)
    ),
    datasets: [{
      data: Object.values(moodCounts),
      backgroundColor: Object.keys(moodCounts).map(mood => getMoodColor(mood)),
      borderWidth: 1,
      hoverOffset: 10
    }]
  };

  return (
    <Box sx={{ 
      maxWidth: '600px', 
      margin: '0 auto',
      padding: 2,
      '& canvas': {
        maxHeight: '400px !important'
      }
    }}>
      <Pie 
        data={chartData} 
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                font: {
                  size: 14
                }
              }
            },
            tooltip: {
              bodyFont: {
                size: 14
              },
              titleFont: {
                size: 16
              }
            }
          }
        }}
      />
    </Box>
  );
}

MoodChart.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      mood: PropTypes.string.isRequired
    })
  ),
  isLoading: PropTypes.bool
};
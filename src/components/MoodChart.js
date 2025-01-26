import React from 'react';
import PropTypes from 'prop-types';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Box, Typography, CircularProgress } from '@mui/material';
import { EmojiEmotions, SentimentDissatisfied, SentimentVeryDissatisfied, Spa, Mood } from '@mui/icons-material';

ChartJS.register(ArcElement, Tooltip, Legend);

const moodConfig = {
  happy: {
    label: 'Happy',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFB347 100%)',
    icon: <EmojiEmotions />
  },
  sad: {
    label: 'Sad',
    gradient: 'linear-gradient(135deg, #4682B4 0%, #5F9EA0 100%)',
    icon: <SentimentDissatisfied />
  },
  angry: {
    label: 'Angry',
    gradient: 'linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%)',
    icon: <SentimentVeryDissatisfied />
  },
  anxious: {
    label: 'Anxious',
    gradient: 'linear-gradient(135deg, #808080 0%, #A9A9A9 100%)',
    icon: <Spa />
  },
  neutral: {
    label: 'Neutral',
    gradient: 'linear-gradient(135deg, #32CD32 0%, #90EE90 100%)',
    icon: <Mood />
  }
};

const getGradient = (ctx, gradient) => {
  const chartGradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.forEach((color, index) => {
    chartGradient.addColorStop(index, color);
  });
  return chartGradient;
};

export default function MoodChart({ entries, isLoading }) {
  if (isLoading) {
    return (
      <Box sx={{
        height: '400px',
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

  if (!entries || entries.length === 0) {
    return (
      <Box sx={{
        height: '400px',
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          No Data Yet 📊
        </Typography>
        <Typography variant="body1" sx={{ 
          color: '#666',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          Your mood statistics will appear here after you start journaling.
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
      moodConfig[mood]?.label || 'Unknown'
    ),
    datasets: [{
      data: Object.values(moodCounts),
      backgroundColor: Object.keys(moodCounts).map(mood => 
        moodConfig[mood]?.gradient || '#667eea'
      ),
      borderWidth: 0,
      hoverOffset: 20,
      spacing: 5,
      borderRadius: 10
    }]
  };

  return (
    <Box sx={{ 
      p: 4,
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
      maxWidth: '800px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <Typography variant="h5" sx={{ 
        mb: 4,
        fontWeight: 600,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Mood Distribution
      </Typography>
      
      <Box sx={{ 
        height: '400px',
        position: 'relative',
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
                position: 'right',
                labels: {
                  padding: 20,
                  font: {
                    size: 14,
                    family: 'Poppins'
                  },
                  generateLabels: (chart) => {
                    const data = chart.data;
                    return data.labels.map((label, i) => ({
                      text: `${label} (${data.datasets[0].data[i]})`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      fontColor: '#64748b',
                      hidden: false,
                      index: i
                    }));
                  }
                }
              },
              tooltip: {
                bodyFont: {
                  size: 14,
                  family: 'Poppins'
                },
                titleFont: {
                  size: 16,
                  family: 'Poppins',
                  weight: '600'
                },
                displayColors: false,
                callbacks: {
                  title: (context) => context[0].label,
                  label: (context) => `${context.parsed} entries`
                }
              }
            }
          }}
        />
      </Box>

      <Box sx={{
        position: 'absolute',
        top: 40,
        right: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        {Object.keys(moodConfig).map(mood => (
          <Box key={mood} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 24,
              height: 24,
              background: moodConfig[mood].gradient,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {React.cloneElement(moodConfig[mood].icon, { 
                sx: { fontSize: 16, color: 'white' } 
              })}
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {moodConfig[mood].label}
            </Typography>
          </Box>
        ))}
      </Box>
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
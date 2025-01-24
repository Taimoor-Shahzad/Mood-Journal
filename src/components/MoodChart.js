import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MoodChart({ entries }) {
  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels: Object.keys(moodCounts).map(mood => 
      mood.charAt(0).toUpperCase() + mood.slice(1)
    ),
    datasets: [{
      data: Object.values(moodCounts),
      backgroundColor: [
        '#FFD700', // Happy
        '#4682B4', // Sad
        '#DC143C', // Angry
        '#808080', // Anxious
        '#32CD32'  // Neutral
      ],
      borderWidth: 1,
    }]
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <Pie 
        data={data} 
        options={{ 
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }}
      />
    </div>
  );
}
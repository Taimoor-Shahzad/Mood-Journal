import React, { useEffect, useState } from 'react';
import { Typography, Card, CardContent, Button, CircularProgress, Box } from '@mui/material';
import PropTypes from 'prop-types';

const defaultQuotes = [
  {
    text: "Every day may not be good, but there's something good in every day.",
    author: "Unknown"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Happiness is not something ready-made. It comes from your own actions.",
    author: "Dalai Lama"
  }
];

export default function Quotes() {
  const [quote, setQuote] = useState({ 
    text: "Loading daily inspiration... 🌟", 
    author: "" 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const fetchQuote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://zenquotes.io/api/random');
      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      if (data[0]?.q) {
        setQuote({ 
          text: data[0].q, 
          author: data[0].a || "Unknown" 
        });
        setErrorCount(0);
      }
    } catch (error) {
      setErrorCount(prev => prev + 1);
      // Use default quotes after 3 consecutive errors
      const fallbackQuote = errorCount >= 2 
        ? defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)]
        : { text: "Unable to fetch new quote. Please try again later.", author: "System" };
      
      setQuote(fallbackQuote);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    const controller = new AbortController();
    fetchQuote();
    return () => controller.abort();
  }, []);

  return (
    <Card sx={{ 
      mb: 2, 
      boxShadow: 3,
      minHeight: 160,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <CardContent>
        <Typography variant="body1" gutterBottom sx={{ fontStyle: 'italic' }}>
          "{quote.text}"
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            - {quote.author}
          </Typography>
          
          <Button 
            size="small" 
            onClick={fetchQuote} 
            disabled={isLoading}
            sx={{ mt: 1 }}
            variant="outlined"
          >
            {isLoading ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : (
              'New Quote'
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

Quotes.propTypes = {
  /** Maximum number of retries before using default quotes */
  maxRetries: PropTypes.number,
};

Quotes.defaultProps = {
  maxRetries: 2
};
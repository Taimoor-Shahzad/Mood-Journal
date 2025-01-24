import React, { useEffect, useState } from 'react';
import { Typography, Card, CardContent, Button } from '@mui/material';

export default function Quotes() {
  const [quote, setQuote] = useState({ 
    text: "Loading daily inspiration... 🌟", 
    author: "" 
  });

  const fetchQuote = async () => {
    try {
      const response = await fetch('https://zenquotes.io/api/random');
      const data = await response.json();
      if (data[0]?.q) {
        setQuote({ 
          text: data[0].q, 
          author: data[0].a || "Unknown" 
        });
      }
    } catch (error) {
      setQuote({
        text: "Every day may not be good, but there's something good in every day.", 
        author: "Unknown"
      });
    }
  };

  useEffect(() => { 
    fetchQuote();
  }, []);

  return (
    <Card sx={{ mb: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="body2" gutterBottom>
          "{quote.text}"
        </Typography>
        <Typography variant="caption" color="text.secondary">
          - {quote.author}
        </Typography>
        <Button 
          size="small" 
          onClick={fetchQuote} 
          sx={{ mt: 1, float: 'right' }}
          variant="outlined"
        >
          New Quote
        </Button>
      </CardContent>
    </Card>
  );
}
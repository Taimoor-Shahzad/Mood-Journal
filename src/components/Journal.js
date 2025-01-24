import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  ButtonGroup,
  CircularProgress,
  Card,
  CardContent,
  Box,
  Chip,
  Alert
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { db, auth, storage } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MoodChart from './MoodChart';
import CalendarView from './CalendarView';
import Quotes from './Quotes';

const moods = {
  happy: '😄 Happy',
  sad: '😢 Sad',
  angry: '😠 Angry',
  anxious: '😰 Anxious',
  neutral: '😐 Neutral'
};

const sentimentMap = {
  POSITIVE: ['happy', 'neutral'],
  NEGATIVE: ['sad', 'angry', 'anxious']
};

const recommendations = {
  happy: ["Take a walk in nature 🌳", "Call a friend 📞", "Dance to favorite song 💃"],
  sad: ["Write in gratitude journal 📖", "Watch a comedy 🎥", "Drink warm tea ☕"],
  angry: ["Practice deep breathing 🌬️", "Punch a pillow 🛏️", "Listen to metal music 🎸"],
  anxious: ["Try 4-7-8 breathing 🧘", "Do progressive muscle relaxation 💪", "Write down worries 📝"],
  neutral: ["Try something new 🎨", "Read a book 📚", "Organize your space 🧹"]
};

export default function Journal() {
  const [entry, setEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) navigate('/auth');
    
    const userDoc = doc(db, 'users', auth.currentUser?.uid);
    const unsubscribe = onSnapshot(userDoc, (doc) => {
      setEntries(doc.data()?.moodEntries || []);
    });
    return unsubscribe;
  }, [navigate]);

  const analyzeSentiment = async (text) => {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
        {
          headers: { 
            Authorization: `Bearer ${process.env.REACT_APP_HF_TOKEN}`,
            'Content-Type': 'application/json' 
          },
          method: "POST",
          body: JSON.stringify({ inputs: text }),
        }
      );
      const result = await response.json();
      return result[0]?.[0]?.label || 'NEUTRAL';
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) return setError('Please select a mood!');
    
    try {
      setLoading(true);
      
      // Image Upload
      let imageUrl = '';
      if (selectedFile) {
        const storageRef = ref(storage, `uploads/${auth.currentUser.uid}/${Date.now()}`);
        await uploadBytes(storageRef, selectedFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // AI Analysis
      const sentiment = await analyzeSentiment(entry);
      const aiFeedback = sentiment ? 
        sentimentMap[sentiment]?.includes(selectedMood) ? 
          "Your mood matches the text sentiment 👍" : 
          "Your mood seems different from the text sentiment 🤔" 
        : "AI analysis unavailable ⚠️";

      // Save to Firestore
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDoc, {
        moodEntries: [...entries, {
          mood: selectedMood,
          text: entry,
          date: new Date().toISOString(),
          aiAnalysis: aiFeedback,
          recommendations: recommendations[selectedMood],
          imageUrl
        }]
      });

      setEntry('');
      setSelectedMood('');
      setSelectedFile(null);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {/* Header with Logout */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">How are you feeling? 🌤️</Typography>
        <Button 
          variant="outlined" 
          onClick={() => auth.signOut()}
          startIcon={<LogoutIcon />}
        >
          Logout
        </Button>
      </Box>

      {/* Navigation Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button component={Link} to="/journal" variant="contained">Journal</Button>
        <Button component={Link} to="/journal/chart" variant="outlined">Mood Chart</Button>
        <Button component={Link} to="/journal/calendar" variant="outlined">Calendar</Button>
      </Box>

      {/* Nested Routes */}
      <Routes>
        <Route index element={
          <>
            <ButtonGroup sx={{ mb: 3 }}>
              {Object.entries(moods).map(([key, value]) => (
                <Button
                  key={key}
                  variant={selectedMood === key ? 'contained' : 'outlined'}
                  onClick={() => setSelectedMood(key)}
                >
                  {value}
                </Button>
              ))}
            </ButtonGroup>

            <form onSubmit={handleSubmit}>
              <TextField
                label="Describe your day..."
                multiline
                rows={4}
                fullWidth
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button 
                variant="outlined" 
                component="label"
                sx={{ mr: 2 }}
              >
                {selectedFile ? "Photo Selected 📷" : "Add Photo"}
                <input 
                  type="file" 
                  hidden 
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  accept="image/*"
                />
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Saving...' : 'Save Entry'}
              </Button>

              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </form>
          </>
        } />
        <Route path="chart" element={<MoodChart entries={entries} />} />
        <Route path="calendar" element={<CalendarView entries={entries} />} />
      </Routes>

      {/* Entries History */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Your Entries 📖
      </Typography>
      
      {entries.slice().reverse().map((entry, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <Chip 
                label={moods[entry.mood]} 
                color="primary" 
                variant="outlined" 
              />
              <Typography variant="body2" color="text.secondary">
                {new Date(entry.date).toLocaleDateString()}
              </Typography>
            </Box>

            <Typography paragraph>{entry.text}</Typography>

            {entry.imageUrl && (
              <img 
                src={entry.imageUrl} 
                alt="Mood entry visual"
                style={{ 
                  maxWidth: '100%', 
                  height: '200px', 
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              />
            )}

            <Typography variant="body2" color="text.secondary">
              {entry.aiAnalysis}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Suggested Activities:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {entry.recommendations?.map((item, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Quotes Sidebar */}
      <Box sx={{ 
        position: 'fixed', 
        right: 20, 
        top: 100, 
        width: 300,
        display: { xs: 'none', md: 'block' }
      }}>
        <Quotes />
      </Box>
    </Container>
  );
}
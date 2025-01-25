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
import { doc, setDoc, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MoodChart from './MoodChart';
import CalendarView from './CalendarView';
import Quotes from './Quotes';
import PropTypes from 'prop-types';

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
    if (!auth.currentUser) {
      navigate('/auth');
      return;
    }

    // Initialize user document reference
    const userDoc = doc(db, 'users', auth.currentUser.uid);
    
    // Set up real-time listener for mood entries
    const entriesCollection = collection(userDoc, 'moodEntries');
    const entriesQuery = query(entriesCollection, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(entriesQuery, (snapshot) => {
      const entriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntries(entriesData);
    });

    return () => unsubscribe();
  }, [navigate]);

  const analyzeSentiment = async (text) => {
    if (!text.trim()) return null;
    
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

      if (!response.ok) throw new Error('AI service unavailable');
      
      const result = await response.json();
      return result[0]?.[0]?.label || 'NEUTRAL';
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedMood) {
      setError('Please select a mood!');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Ensure user document exists
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {}, { merge: true });

      // Handle image upload
      let imageUrl = '';
      if (selectedFile) {
        if (selectedFile.size > 5 * 1024 * 1024) {
          throw new Error('Image size must be less than 5MB');
        }

        const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}`);
        await uploadBytes(storageRef, selectedFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Get sentiment analysis
      const sentiment = await analyzeSentiment(entry);
      let aiFeedback = "AI analysis unavailable ⚠️";
      
      if (sentiment) {
        aiFeedback = sentimentMap[sentiment]?.includes(selectedMood) 
          ? "Your mood matches the text sentiment 👍" 
          : "Your mood seems different from the text sentiment 🤔";
      }

      // Add to mood entries subcollection
      const entriesCollection = collection(userDocRef, 'moodEntries');
      await addDoc(entriesCollection, {
        mood: selectedMood,
        text: entry,
        date: new Date().toISOString(),
        aiAnalysis: aiFeedback,
        recommendations: recommendations[selectedMood],
        imageUrl
      });

      // Reset form
      setEntry('');
      setSelectedMood('');
      setSelectedFile(null);

    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {/* Header */}
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

      {/* Navigation */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button component={Link} to="/journal" variant="contained">Journal</Button>
        <Button component={Link} to="/journal/chart" variant="outlined">Chart</Button>
        <Button component={Link} to="/journal/calendar" variant="outlined">Calendar</Button>
      </Box>

      {/* Main Content */}
      <Routes>
        <Route index element={
          <>
            <ButtonGroup sx={{ mb: 3 }}>
              {Object.entries(moods).map(([key, value]) => (
                <Button
                  key={key}
                  variant={selectedMood === key ? 'contained' : 'outlined'}
                  onClick={() => setSelectedMood(key)}
                  disabled={loading}
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
                disabled={loading}
              />

              <Button 
                variant="outlined" 
                component="label"
                sx={{ mr: 2 }}
                disabled={loading}
              >
                {selectedFile ? "Photo Selected 📷" : "Add Photo"}
                <input 
                  type="file" 
                  hidden 
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  accept="image/*"
                  disabled={loading}
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
      
      {entries.map((entry) => (
        <Card key={entry.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <Chip 
                label={moods[entry.mood] || 'Unknown Mood'} 
                color="primary" 
                variant="outlined" 
              />
              <Typography variant="body2" color="text.secondary">
                {new Date(entry.date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>

            <Typography paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {entry.text}
            </Typography>

            {entry.imageUrl && (
              <Box 
                component="img"
                src={entry.imageUrl}
                alt="Journal entry visual"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: 2,
                  mb: 2
                }}
              />
            )}

            <Typography variant="body2" color="text.secondary">
              {entry.aiAnalysis}
            </Typography>

            {entry.recommendations?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Suggested Activities:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {entry.recommendations.map((item, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </Box>
            )}
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

Journal.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      mood: PropTypes.string.isRequired,
      text: PropTypes.string,
      date: PropTypes.string.isRequired,
      aiAnalysis: PropTypes.string,
      recommendations: PropTypes.arrayOf(PropTypes.string),
      imageUrl: PropTypes.string
    })
  )
};
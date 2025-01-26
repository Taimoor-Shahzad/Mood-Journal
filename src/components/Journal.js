import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  TextField, 
  Button,
  CircularProgress,
  Card,
  CardContent,
  Box,
  Chip,
  Alert,
  IconButton
} from '@mui/material';
import { Logout, AddPhotoAlternate, Mood, EmojiEmotions, SentimentDissatisfied, SentimentVeryDissatisfied, Spa } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { db, auth, storage } from '../firebase';
import { doc, setDoc, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MoodChart from './MoodChart';
import CalendarView from './CalendarView';
import Quotes from './Quotes';
import PropTypes from 'prop-types';

const moodConfig = {
  happy: { 
    label: 'Radiant', 
    icon: <EmojiEmotions sx={{ fontSize: 32 }} />,
    color: '#4ade80',
    gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
  },
  sad: {
    label: 'Melancholy',
    icon: <SentimentDissatisfied sx={{ fontSize: 32 }} />,
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
  },
  angry: {
    label: 'Frustrated',
    icon: <SentimentVeryDissatisfied sx={{ fontSize: 32 }} />,
    color: '#f87171',
    gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)'
  },
  anxious: {
    label: 'Apprehensive',
    icon: <Spa sx={{ fontSize: 32 }} />,
    color: '#c084fc',
    gradient: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)'
  },
  neutral: {
    label: 'Balanced',
    icon: <Mood sx={{ fontSize: 32 }} />,
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
  }
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
  const location = useLocation();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/auth');
      return;
    }

    const userDoc = doc(db, 'users', auth.currentUser.uid);
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

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {}, { merge: true });

      let imageUrl = '';
      if (selectedFile) {
        if (selectedFile.size > 5 * 1024 * 1024) {
          throw new Error('Image size must be less than 5MB');
        }

        const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}`);
        await uploadBytes(storageRef, selectedFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const sentiment = await analyzeSentiment(entry);
      let aiFeedback = "AI analysis unavailable ⚠️";
      
      if (sentiment) {
        aiFeedback = sentimentMap[sentiment]?.includes(selectedMood) 
          ? "Your mood matches the text sentiment 👍" 
          : "Your mood seems different from the text sentiment 🤔";
      }

      const entriesCollection = collection(userDocRef, 'moodEntries');
      await addDoc(entriesCollection, {
        mood: selectedMood,
        text: entry,
        date: new Date().toISOString(),
        aiAnalysis: aiFeedback,
        recommendations: recommendations[selectedMood],
        imageUrl
      });

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
    <Container maxWidth="md" sx={{ pt: 4, pb: 8 }}>
      {/* Enhanced Header */}
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        py: 2,
        px: 4,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          MoodScape
        </Typography>
        <IconButton onClick={() => auth.signOut()} sx={{ color: '#667eea' }}>
          <Logout />
        </IconButton>
      </Box>

      {/* Floating Navigation */}
      <Box sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 1,
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '24px',
        padding: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000
      }}>
        {['journal', 'chart', 'calendar'].map((route) => (
  <Button
    key={route}
    component={Link}
    to={`/journal/${route === 'journal' ? '' : route}`}
    sx={{
      minWidth: 100,
      borderRadius: '16px',
      textTransform: 'capitalize',
      background: location.pathname.includes(route) ? 
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
      color: location.pathname.includes(route) ? 'white' : '#64748b'
    }}
  >
    {route}
  </Button>
))}
      </Box>

      {/* Main Content */}
      <Box sx={{ mt: 8 }}>
        <Routes>
          <Route index element={
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              {/* Enhanced Mood Selector */}
              <Typography variant="h6" sx={{ mb: 2, color: '#64748b' }}>
                How are you feeling today?
              </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 2,
                mb: 4
              }}>
                {Object.entries(moodConfig).map(([key, mood]) => (
                  <motion.div 
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      fullWidth
                      variant={selectedMood === key ? 'contained' : 'outlined'}
                      onClick={() => setSelectedMood(key)}
                      sx={{
                        height: 120,
                        borderRadius: '16px',
                        borderWidth: selectedMood === key ? 0 : 2,
                        background: selectedMood === key ? 
                          mood.gradient : 'transparent',
                        color: selectedMood === key ? 'white' : mood.color,
                        borderColor: mood.color
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {mood.icon}
                        <Typography variant="caption">{mood.label}</Typography>
                      </Box>
                    </Button>
                  </motion.div>
                ))}
              </Box>

              {/* Enhanced Journal Form */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ 
                  background: 'white',
                  borderRadius: '24px',
                  p: 4,
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.1)'
                }}>
                  <TextField
                    label="Reflect on your day..."
                    multiline
                    rows={4}
                    fullWidth
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    disabled={loading}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        borderColor: '#e2e8f0'
                      }
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                    <Button 
                      variant="outlined" 
                      component="label"
                      startIcon={<AddPhotoAlternate />}
                      disabled={loading}
                      sx={{
                        borderRadius: '12px',
                        borderColor: '#cbd5e1',
                        color: '#64748b',
                        '&:hover': {
                          borderColor: '#94a3b8'
                        }
                      }}
                    >
                      {selectedFile ? "Photo Added" : "Add Photo"}
                      <input 
                        type="file" 
                        hidden 
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        accept="image/*"
                        disabled={loading}
                      />
                    </Button>
                    
                    {selectedFile && (
                      <Typography variant="caption" color="text.secondary">
                        {selectedFile.name}
                      </Typography>
                    )}
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 500,
                      '&:disabled': {
                        background: '#e2e8f0'
                      }
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : 'Save Reflection'}
                  </Button>

                  {error && (
                    <Alert severity="error" sx={{ mt: 3, borderRadius: '12px' }}>
                      {error}
                    </Alert>
                  )}
                </Box>
              </motion.div>
            </Box>
          } />
          <Route path="chart" element={<MoodChart entries={entries} />} />
          <Route path="calendar" element={<CalendarView entries={entries} />} />
        </Routes>

        {/* Enhanced Entries History */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" sx={{ 
            mb: 4,
            fontWeight: 600,
            color: '#1e293b'
          }}>
            Past Reflections
          </Typography>
          
          {entries.map((entry) => (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card sx={{ 
                mb: 3, 
                borderRadius: '16px',
                background: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 2,
                    p: 2,
                    background: `${moodConfig[entry.mood]?.color}10`,
                    borderRadius: '12px'
                  }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      background: moodConfig[entry.mood]?.gradient,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {moodConfig[entry.mood]?.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {moodConfig[entry.mood]?.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography paragraph sx={{ 
                    whiteSpace: 'pre-wrap',
                    color: '#334155',
                    lineHeight: 1.6
                  }}>
                    {entry.text}
                  </Typography>

                  {entry.imageUrl && (
                    <Box 
                      component="img"
                      src={entry.imageUrl}
                      alt="Journal visual"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 400,
                        objectFit: 'cover',
                        borderRadius: '12px',
                        mb: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  )}

                  <Box sx={{ 
                    mb: 2,
                    p: 2,
                    background: '#f8fafc',
                    borderRadius: '12px'
                  }}>
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                      {entry.aiAnalysis}
                    </Typography>
                  </Box>

                  {entry.recommendations?.length > 0 && (
                    <Box sx={{
                      p: 2,
                      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        mb: 1,
                        color: '#64748b',
                        fontWeight: 600
                      }}>
                        Suggested Activities
                      </Typography>
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 1.5
                      }}>
                        {entry.recommendations.map((item, i) => (
                          <Box key={i} sx={{
                            p: 1.5,
                            background: 'white',
                            borderRadius: '8px',
                            border: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <Box sx={{
                              width: 24,
                              height: 24,
                              background: moodConfig[entry.mood]?.gradient,
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              {moodConfig[entry.mood]?.icon}
                            </Box>
                            <Typography variant="body2" sx={{ color: '#475569' }}>
                              {item}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Box>
      </Box>

      {/* Quotes Sidebar */}
      <Box sx={{ 
        position: 'fixed',
        right: 32,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 280,
        display: { xs: 'none', xl: 'block' }
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
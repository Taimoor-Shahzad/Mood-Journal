import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Alert 
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { auth, db, googleProvider } from '../firebase'; // Added missing db import
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: new Date(),
          moodEntries: []
        });
      }
      setError('');
    } catch (err) {
      setError(err.message.replace('Firebase: ', '')); // Cleaner error messages
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      if (userCredential._tokenResponse.isNewUser) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: new Date(),
          moodEntries: []
        });
      }
      setError('');
    } catch (err) {
      setError(err.message.replace('Firebase: ', '')); // Cleaner error messages
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Mood Journal 🌈
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button 
        fullWidth
        variant="outlined" 
        onClick={handleGoogleLogin}
        startIcon={<GoogleIcon />}
        sx={{ mb: 2 }}
      >
        Continue with Google
      </Button>

      <Typography align="center" sx={{ mb: 2 }}>OR</Typography>

      <form onSubmit={handleAuth}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          inputProps={{ minLength: 6 }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
        >
          {isLogin ? 'Login' : 'Create Account'}
        </Button>
      </form>

      <Button 
        fullWidth 
        sx={{ mt: 2 }}
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
      </Button>
    </Container>
  );
}
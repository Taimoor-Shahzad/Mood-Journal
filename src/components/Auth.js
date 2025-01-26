import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  Divider,
  Box
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { auth, db, googleProvider } from '../firebase';
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
      setError(err.message.replace('Firebase: ', ''));
    }
  };
  
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
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <Container maxWidth="xs" sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 0
    }}>
      <Box sx={{
        width: '100%',
        padding: '40px 24px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <Typography variant="h4" align="center" sx={{
          mb: 4,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {isLogin ? 'Welcome' : 'Get Started 🌟'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={handleGoogleLogin}
          startIcon={<GoogleIcon />}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            '&:hover': {
              opacity: 0.9,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }
          }}
        >
          Continue with Google
        </Button>

        <Divider sx={{ my: 3, color: '#666', '&::before, &::after': {
          background: 'linear-gradient(90deg, transparent 0%, #667eea 50%, transparent 100%)'
        } }}>
          or
        </Divider>

        <form onSubmit={handleAuth}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': {
                  borderColor: '#ddd'
                }
              }
            }}
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': {
                  borderColor: '#ddd'
                }
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              '&:hover': {
                opacity: 0.9,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }
            }}
          >
            {isLogin ? 'Login' : 'Create Account'}
          </Button>
        </form>

        <Button 
          fullWidth 
          sx={{
            mt: 2,
            textTransform: 'none',
            color: '#667eea',
            fontWeight: 500,
            '&:hover': {
              background: 'transparent'
            }
          }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin 
            ? 'New here? Create an account' 
            : 'Already have an account? Sign in'}
        </Button>
      </Box>
    </Container>
  );
}
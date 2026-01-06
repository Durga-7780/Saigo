/**
 * AI Chatbot Page
 * Interactive AI assistant for employee queries
 */
import { Person, Refresh, Send, SmartToy } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { chatbotAPI } from '../services/api';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Hi, I’m Saigo Assist. I can help you with attendance, leave, and app usage.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSuggestions();
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSuggestions = async () => {
    try {
      const response = await chatbotAPI.getSuggestions();
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSend = async (query = input) => {
    if (!query.trim()) return;

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotAPI.ask({ query });
      const botMessage = {
        role: 'bot',
        content: response.data.answer,
        timestamp: new Date(),
        suggestions: response.data.suggestions,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          AI Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ask me anything about attendance, leaves, policies, and more
        </Typography>
      </Box>

      <Card
        sx={{
          height: 'calc(100vh - 280px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 2,
              }}
            >
              {message.role === 'bot' && (
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <SmartToy />
                </Avatar>
              )}
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.role === 'user' ? 'primary.main' : 'white',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: 3,
                  animation: 'fadeIn 0.3s ease-in',
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: 'block',
                    opacity: 0.7,
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
              {message.role === 'user' && (
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <Person />
                </Avatar>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SmartToy />
              </Avatar>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="body1">Thinking...</Typography>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Suggestions */}
        {(suggestions || []).length > 0 && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Quick suggestions:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(suggestions || []).slice(0, 4).map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Input */}
        <Box sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              sx={{
                minWidth: 56,
                height: 56,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <Send />
            </Button>
            <IconButton
              onClick={fetchSuggestions}
              sx={{
                minWidth: 56,
                height: 56,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default Chatbot;

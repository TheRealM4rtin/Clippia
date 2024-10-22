import React, { useState } from 'react';


const Feedback: React.FC = () => {
  const [username, setUsername] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !feedback.trim()) {
      setError("Please fill in both username and feedback.");
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, feedback }),
      });
      if (response.ok) {
        setIsSubmitted(true);
        setUsername('');
        setFeedback('');
      } else {
        const data = await response.json();
        setError(`Failed to submit feedback: ${data.error}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('An error occurred. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div>
        Thanks! : )
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} >
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Your username"
        style={inputStyle}
        disabled={isSubmitting}
      />
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Your feedback"
        style={{ ...inputStyle, height: '100px' }}
        disabled={isSubmitting}
      />
      <div>
        <button type="submit" style={buttonStyle} disabled={isSubmitting || !username.trim() || !feedback.trim()}>
          Send
        </button>
        <button type="button" onClick={() => { setUsername(''); setFeedback(''); setError(''); }} style={buttonStyle} disabled={isSubmitting}>
          Clear
        </button>
      </div>
      {isSubmitting && <div><progress></progress></div>}
      {error && <div style={errorStyle}>{error}</div>}
    </form>
  );
};

const inputStyle = {
  display: 'block',
  width: '100%',
  marginBottom: '8px',
  padding: '4px',
  fontFamily: '"Pixelated MS Sans Serif", Arial',
  fontSize: '11px',
  border: '1px solid #808080',
};

const buttonStyle = {
  fontFamily: '"Pixelated MS Sans Serif", Arial',
  fontSize: '11px',
  color: 'black',
  backgroundColor: '#D4D0C8',
  border: '1px solid #808080',
  padding: '2px 8px',
  marginRight: '4px',
  cursor: 'pointer',
};


const errorStyle = {
  fontFamily: '"Pixelated MS Sans Serif", Arial',
  fontSize: '11px',
  color: 'red',
  marginTop: '8px',
};

export default Feedback;

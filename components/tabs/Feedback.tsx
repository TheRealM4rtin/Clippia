import React, { useState } from 'react';
import styles from './Feedback.module.css';

interface FeedbackProps {
  width: number;
}

const Feedback: React.FC<FeedbackProps> = ({ width }) => {
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
      <div className={styles.feedback} style={{ width: width - 12 }}>
        Thanks! : )
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.feedback} style={{ width: width - 12 }}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Your username"
        disabled={isSubmitting}
      />
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Your feedback"
        disabled={isSubmitting}
      />
      <div className={styles.buttonGroup}>
        <button type="submit" disabled={isSubmitting || !username.trim() || !feedback.trim()}>
          Send
        </button>
        <button type="button" onClick={() => { setUsername(''); setFeedback(''); setError(''); }} disabled={isSubmitting}>
          Clear
        </button>
      </div>
      {isSubmitting && <div><progress></progress></div>}
      {error && <div className={styles.error}>{error}</div>}
    </form>
  );
};

export default Feedback;

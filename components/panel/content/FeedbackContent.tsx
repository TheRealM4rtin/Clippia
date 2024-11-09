import React, { useState, useEffect } from 'react';
import { RadioButton } from '@react95/core';
import styles from '../style/FeedbackWindow.module.css';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackProps {
  width: number;
}

const Feedback: React.FC<FeedbackProps> = ({ width }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [wouldContribute, setWouldContribute] = useState<string | null>(null);
  const [contributionDetails, setContributionDetails] = useState('');

  useEffect(() => {
    if (user?.email) {
      setUsername(user.email);
    }
  }, [user]);

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
        body: JSON.stringify({ 
          username, 
          feedback, 
          wouldContribute, 
          contributionDetails: wouldContribute === 'yes' ? contributionDetails : null,
        }),
      });
      if (response.ok) {
        setIsSubmitted(true);
        resetForm();
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

  const resetForm = () => {
    setFeedback('');
    setWouldContribute(null);
    setContributionDetails('');
    setError('');
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
        disabled={isSubmitting || !!user}
      />
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Your feedback"
        disabled={isSubmitting}
      />
      <div className={styles.contributionQuestion}>
        <p>If the project was open-source, would you like to contribute?</p>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <RadioButton
              name="contribution"
              value="yes"
              checked={wouldContribute === 'yes'}
              onChange={() => setWouldContribute('yes')}
              disabled={isSubmitting}
            />
            Yes
          </label>
          <label className={styles.radioLabel}>
            <RadioButton
              name="contribution"
              value="no"
              checked={wouldContribute === 'no'}
              onChange={() => setWouldContribute('no')}
              disabled={isSubmitting}
            />
            No
          </label>
        </div>
      </div>
      {wouldContribute === 'yes' && (
        <input
          type="text"
          value={contributionDetails}
          onChange={(e) => setContributionDetails(e.target.value)}
          placeholder="How would you like to contribute?"
          disabled={isSubmitting}
        />
      )}
      <div className={styles.buttonGroup}>
        <button type="submit" disabled={isSubmitting || !username.trim() || !feedback.trim()}>
          Send
        </button>
        <button type="button" onClick={resetForm} disabled={isSubmitting}>
          Clear
        </button>
      </div>
      {isSubmitting && <div><progress></progress></div>}
      {error && <div className={styles.error}>{error}</div>}
    </form>
  );
};

export default Feedback;

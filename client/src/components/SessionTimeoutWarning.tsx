import React from 'react';
import './SessionTimeoutWarning.css';

interface SessionTimeoutWarningProps {
  remainingSeconds: number;
  onStayLoggedIn: () => void;
}

/**
 * Session Timeout Warning Modal
 * 
 * Displays an overlay warning the user that their session will expire soon.
 * Shows a countdown timer and provides a button to stay logged in.
 */
const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  remainingSeconds,
  onStayLoggedIn,
}) => {
  console.log('[SessionTimeoutWarning] 🎨 Modal rendering with', remainingSeconds, 'seconds');

  // Format seconds as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle keyboard events (Enter or Space to stay logged in, Escape does nothing)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onStayLoggedIn();
    }
  };

  return (
    <div className="session-timeout-overlay" role="dialog" aria-modal="true" aria-labelledby="timeout-title">
      <div className="session-timeout-modal">
        <div className="session-timeout-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h2 id="timeout-title" className="session-timeout-title">
          Session Expiring Soon
        </h2>

        <p className="session-timeout-message">
          Your session will expire due to inactivity. You will be automatically logged out in:
        </p>

        <div 
          className={`session-timeout-countdown ${remainingSeconds <= 30 ? 'session-timeout-countdown--urgent' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {formatTime(remainingSeconds)}
        </div>

        <button
          type="button"
          className="session-timeout-button"
          onClick={onStayLoggedIn}
          onKeyDown={handleKeyDown}
          autoFocus
        >
          Stay Logged In
        </button>

        <p className="session-timeout-hint">
          Any activity will keep your session active
        </p>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;

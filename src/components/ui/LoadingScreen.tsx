import React from 'react';

const LoadingScreen: React.FC<{ error?: Error }> = ({ error }) => {
  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        color: '#666',
        fontSize: '12px'
      }}>
        ⚠️
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      color: '#666',
      fontSize: '12px'
    }}>
      ⌛
    </div>
  );
};

export default LoadingScreen; 
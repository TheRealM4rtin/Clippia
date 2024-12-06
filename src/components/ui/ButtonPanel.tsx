import React from 'react'

type ButtonProps = {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({ onClick, disabled, className, children }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
};

interface ButtonPanelProps {
  children: React.ReactNode
}

const ButtonPanel: React.FC<ButtonPanelProps> & { Button: typeof Button } = ({ children }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
    {children}
  </div>
)

ButtonPanel.Button = Button

export default ButtonPanel
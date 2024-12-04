import React from 'react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange }) => {
  const colors = [
    '#FFFFFF',     // White
    '#047e7e',     // Teal
    '#F6C6FB',     // Pink
  ];

  return (
    <div className={styles.colorPickerContainer}>
      <div className={styles.colorBox}>
        {colors.map((color) => (
          <div
            key={color}
            className={`${styles.colorSquare} ${selectedColor === color ? styles.selected : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker; 
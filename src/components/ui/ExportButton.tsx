import React from 'react';
import Image from 'next/image';

interface ExportButtonProps {
  onExport: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onExport }) => {
  const PrinterIcon = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(({ ...props }, ref) => (
    <Image
      ref={ref}
      {...props}
      src="/icons/printer.ico"
      alt="Printer Icon"
      width={20} // Adjust the width as needed
      height={20} // Adjust the height as needed
    />
  ));

  PrinterIcon.displayName = 'PrinterIcon';

  return (
    <button
      onClick={onExport}
      title="Export as PNG"
    >
      <PrinterIcon alt="Printer Icon" />
    </button>
  );
};

export default ExportButton;
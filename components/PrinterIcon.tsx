import React from 'react';
import Image from 'next/image';

interface PrinterIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onExport: () => void;
}

const PrinterIcon = React.forwardRef<HTMLImageElement, PrinterIconProps>(({ onExport, ...props }, ref) => (
  <Image
    ref={ref}
    {...props}
    src="/icons/printer.ico"
    alt="Printer Icon"
    width={10} // Adjust the width as needed
    height={10} // Adjust the height as needed
    onClick={onExport} // Attach the onExport action to the icon
    style={{ cursor: 'pointer' }} // Optional: change cursor to pointer to indicate clickability
  />
));

PrinterIcon.displayName = 'PrinterIcon';

export default PrinterIcon;

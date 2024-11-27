import React from 'react';
import Image from 'next/image';
import { NodeProps } from '@xyflow/react';

interface ImageNodeData extends Record<string, unknown> {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const ImageNode = ({ data }: NodeProps) => {
  const imageData = data as ImageNodeData;
  return (
    <div style={{ width: imageData.width, height: imageData.height }}>
      <Image
        src={imageData.src}
        alt={imageData.alt}
        width={imageData.width}
        height={imageData.height}
        className="rounded-lg shadow-lg"
        draggable={false}
      />
    </div>
  );
};

export default ImageNode; 
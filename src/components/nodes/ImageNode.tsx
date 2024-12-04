import React from 'react';
import { NodeProps } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import Image from 'next/image';

interface ImageNodeData {
  src: string;
  alt: string;
  width: number;
  height: number;
  showDeleteButton?: boolean;
}

const ImageNode: React.FC<NodeProps> = ({ id, data }) => {
  const { onNodesChange } = useAppStore();
  const imageData = data as unknown as ImageNodeData;

  const handleDelete = () => {
    onNodesChange([
      {
        type: 'remove',
        id,
      },
    ]);
  };

  return (
    <div style={{ position: 'relative' }}>
      <Image
        src={imageData.src}
        alt={imageData.alt}
        width={imageData.width}
        height={imageData.height}
        style={{ objectFit: 'contain' }}
      />
      {imageData.showDeleteButton && (
        <div className="title-bar-controls" style={{ 
          position: 'absolute',
          top: -4,
          right: -2,
          zIndex: 1000,
          // background: '#c0c0c0',
          padding: '2px',
        }}>
          <button aria-label="Close" onClick={handleDelete} />
        </div>
      )}
    </div>
  );
};

export default ImageNode; 
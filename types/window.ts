export interface Window {
  id: number;
  title: string;
  content: string;
  position: {
    x: number; // percentage
    y: number; // percentage
  };
  size: {
    width: number; // percentage
    height: number; // percentage
  };
  zIndex: number;
  creationTime: Date;
  isNew: boolean;
  isReadOnly: boolean;
  type: 'text' | 'myComputer';
}

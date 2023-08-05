import { FC } from 'react';

import '../assets/styles/preload.css';

interface PreLoaderProps {
  isOpen: boolean;
}

export const LoadingOverlay: FC<PreLoaderProps> = ({ isOpen }) => {
  return isOpen ? (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <span>🐾</span>
        <div className="half-spinner"></div>
      </div>
    </div>
  ) : (
    <></>
  );
};

export default LoadingOverlay;

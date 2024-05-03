import { useState } from 'react';

export const useFlasher = () => {
  const [connectionStatus, setFlasherConnectionStatus] = useState<string>('Не подключен.');
  const [flashing, setFlashing] = useState(false);

  return {
    connectionStatus,
    setFlasherConnectionStatus,
    flashing,
    setFlashing,
  };
};

import React from 'react';

interface FailureActionsProps {
  reconnectLabel: React.ReactNode;
  reconnectDisabled: boolean;
  onReconnect: () => void;
  onShowErrorDescription: () => void;
}

export const FailureActions: React.FC<FailureActionsProps> = ({
  reconnectLabel,
  reconnectDisabled,
  onReconnect,
  onShowErrorDescription,
}) => (
  <>
    <button
      type="button"
      className="btn-primary mr-2 p-0 px-2"
      onClick={onReconnect}
      disabled={reconnectDisabled}
    >
      {reconnectLabel}
    </button>
    <button
      type="button"
      className="btn-primary mr-2 border-warning bg-warning p-0 px-2"
      onClick={onShowErrorDescription}
    >
      Описание ошибки
    </button>
  </>
);

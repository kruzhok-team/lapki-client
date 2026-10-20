import { ReactComponent as CircleIcon } from '@renderer/assets/icons/circle.svg';
import { ClientStatus } from '@renderer/components/Modules/Websocket/ClientStatus';

interface ConnectionIndicatorProps {
  status: string;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ status }) => {
  const colorClass =
    status === ClientStatus.CONNECTED || status === 'Подключено'
      ? 'fill-success'
      : status === ClientStatus.NO_CONNECTION ||
          status === ClientStatus.CONNECTION_ERROR ||
          status === 'Не подключено' ||
          status === 'Отсутствует подключение к серверу'
        ? 'fill-error'
        : 'fill-text-inactive';

  return (
    <CircleIcon
      className={`ml-1 inline-block shrink-0 ${colorClass}`}
      width="8px"
      height="8px"
      role="img"
      aria-label={`Состояние подключения: ${status}`}
    />
  );
};

import { ReactComponent as ArrowIcon } from '@renderer/assets/icons/arrow-down.svg';

import { AddButton } from './AddButton';

interface PanelHeaderProps {
  title: string;
  isCollapsed: () => boolean;
  togglePanel: () => void;
  requestAddAction?: () => void;
  isAddDisabled?: boolean;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  isCollapsed,
  togglePanel,
  requestAddAction,
  isAddDisabled,
}) => {
  return (
    <div className="flex shrink-0 items-center py-3">
      <button className="flex items-center" onClick={togglePanel} type="button">
        <ArrowIcon
          className={
            isCollapsed() ? '-rotate-90 transition-transform' : 'rotate-0 transition-transform'
          }
        />
        <h3 className="ml-[9px] text-xs font-medium">{title}</h3>
      </button>
      {requestAddAction && <AddButton disabled={isAddDisabled} onClick={requestAddAction} />}
    </div>
  );
};

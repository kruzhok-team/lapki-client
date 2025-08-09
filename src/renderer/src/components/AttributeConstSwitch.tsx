import Switch from 'react-switch';
import { twMerge } from 'tailwind-merge';

import { ReactComponent as AttributeIcon } from '@renderer/assets/icons/useAttribute.svg';
import { ReactComponent as ConstIcon } from '@renderer/assets/icons/useConst.svg';
import { getColor } from '@renderer/theme';

import { WithHint } from './UI';
interface AttributeConstSwitch {
  isAttribute: boolean;
  onCheckedChange: (isAttribute: boolean) => void;
  className?: string;
  isDisabled?: boolean;
}

export const AttributeConstSwitch: React.FC<AttributeConstSwitch> = ({
  isAttribute,
  onCheckedChange,
  className,
  isDisabled,
  ...props
}) => {
  const getHint = () => {
    if (!isDisabled) {
      return isAttribute ? 'Переключиться на константу' : 'Переключиться на атрибут компонента';
    }
    return null;
  };
  // Методы onColor и offColor чувствительны к пробелам (getColor возвращает hex число с ведущим пробелом)
  const switchBgColor = getColor('bg-primary').trim();
  // Здесь не важно, если ведущий пробел или нет
  const switchIconsColor = getColor('primary');
  return (
    <div {...props}>
      <WithHint hint={getHint()}>
        {(hintProps) => (
          <div {...hintProps}>
            <Switch
              type="button"
              role="switch"
              className={twMerge('shadow-[0_0_0_1px] shadow-border-primary', className)}
              onChange={(checked) => onCheckedChange(checked)}
              checked={isAttribute}
              disabled={isDisabled}
              checkedIcon={
                <ConstIcon
                  className="absolute left-0.5 top-[10%] size-[23px] opacity-40"
                  color={switchIconsColor}
                />
              }
              checkedHandleIcon={<AttributeIcon color={switchIconsColor} />}
              uncheckedIcon={
                <AttributeIcon
                  className=" absolute right-0.5 top-[10%] size-[23px] opacity-40"
                  color={switchIconsColor}
                />
              }
              uncheckedHandleIcon={<ConstIcon color={switchIconsColor} />}
              onColor={switchBgColor}
              offColor={switchBgColor}
              handleDiameter={24}
            />
          </div>
        )}
      </WithHint>
    </div>
  );
};

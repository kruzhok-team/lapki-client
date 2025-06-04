import React from 'react';

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
              className={twMerge(
                'bg-bg-secondary shadow-[0_0_0_1px] shadow-border-primary outline-none focus:shadow-[0_0_0_1px]',
                className
              )}
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
            {/* <RSwitch.Root
              className={twMerge(
                'relative h-[25px] w-[42px] cursor-pointer rounded-full bg-bg-secondary shadow-[0_0_0_1px] shadow-border-primary outline-none focus:shadow-[0_0_0_1px]',
                className
              )}
              id="airplane-mode"
              checked={isAttribute}
              disabled={isDisabled}
              onCheckedChange={onCheckedChange}
            >
              <RSwitch.Thumb className="block size-[21px] translate-x-0.5 rounded-full shadow-[0_0_0_1px] shadow-border-contrast transition duration-100 will-change-transform data-[state=checked]:translate-x-[19px]">
                {isAttribute ? <AttributeIcon /> : <ConstIcon />}
              </RSwitch.Thumb>
            </RSwitch.Root> */}
          </div>
        )}
      </WithHint>
    </div>
  );
};

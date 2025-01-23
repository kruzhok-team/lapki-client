import React, { useState } from 'react';

import { twMerge } from 'tailwind-merge';

interface AttributeConstSwitch {
  isAttributeOutside?: boolean;
  hidden?: boolean;
  disabled?: boolean;
}

export const AttributeConstSwitch: React.FC<AttributeConstSwitch> = ({
  isAttributeOutside,
  hidden,
  disabled,
  ...props
}) => {
  const [isAttributeInternal, setIsAttributeInternal] = useState<boolean>(
    isAttributeOutside ?? false
  );
  const lowOpacity = 'opacity-20';
  return (
    <div className="flex-row" {...props} hidden={hidden ?? false}>
      <button
        className={twMerge('btn-secondary px-2 py-1', !isAttributeInternal && lowOpacity)}
        disabled={disabled ?? false}
        onClick={() => setIsAttributeInternal(true)}
        type="button"
      >
        ❎
      </button>
      <button
        className={twMerge('btn-secondary px-2 py-1', isAttributeInternal && lowOpacity)}
        disabled={disabled ?? false}
        onClick={() => setIsAttributeInternal(false)}
        type="button"
      >
        ✏
      </button>
    </div>
  );
};

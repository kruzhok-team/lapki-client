import React from 'react';
import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

interface StateNameModalProps {
  isOpen: boolean;
  isName: { state; position } | undefined;
  onClose: () => void;
  onRename: (data: StateNameModalFormValues) => void;
}

export interface StateNameModalFormValues {
  id: string;
  name: string;
}

export const StateNameModal: React.FC<StateNameModalProps> = ({ onClose, onRename, isName }) => {
  const { register, handleSubmit: hookHandleSubmit } = useForm<StateNameModalFormValues>();

  const onRequestClose = () => {
    onClose();
  };

  const handleSubmit = hookHandleSubmit((formData) => {
    console.log(formData.name);
    const data: StateNameModalFormValues = {
      id: isName?.state.id,
      name: formData.name !== '' ? formData.name : 'Состояние',
    };
    onRename(data);
  });

  const inputStyle = {
    left: isName?.position.x + 'px',
    top: isName?.position.y + 'px',
    width: isName?.position.width + 'px',
    height: isName?.position.height + 'px',
  };

  return (
    <>
      {isName !== undefined && (
        <input
          style={inputStyle}
          autoFocus
          onKeyUp={(e) => {
            var keyCode = e.keyCode;
            if (e.key === 'Enter') {
              handleSubmit();
            } else if (keyCode === 27) {
              onRequestClose();
            }
          }}
          className={twMerge(
            'fixed rounded-t-[6px] border-2 border-solid bg-[#525252] px-3 font-Fira text-white focus:outline-none'
          )}
          placeholder="Придумайте название"
          maxLength={20}
          {...register('name', {
            onBlur() {
              onRequestClose();
            },
            minLength: { value: 2, message: 'Минимум 2 символа!' },
            value: isName.state.data.name,
          })}
        />
      )}
      ,
    </>
  );
};

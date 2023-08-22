import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { ColorInput } from './Modal/ColorInput';
import { Modal } from './Modal/Modal';
import { twMerge } from 'tailwind-merge';
import { TextSelect } from './Modal/TextSelect';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { TextInput } from './Modal/TextInput';
import { Action } from '@renderer/types/diagram';
import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';

interface CreateModalProps {
  isOpen: boolean;
  editor: CanvasEditor | null;
  isData: { state } | undefined;
  isCondition: Action[] | undefined;
  isName: { state; position } | undefined;
  onOpenEventsModal: () => void;
  onClose: () => void;
  onSubmit: (data: CreateModalFormValues) => void;
}

export interface CreateModalFormValues {
  id: string;
  key: number;
  name: string;
  //Данные основного события
  triggerComponent: string;
  triggerMethod: string;
  //Данные вторичного событий
  doComponent: string;
  doMethod: string;
  //Массив вторичных событий
  condition: Action[];
  //Параметр события
  doArgs: { [key: string]: string } | undefined;

  doComponentOneElse: string;
  doMethodOneElse: string;
  doComponentTwoElse: string;
  doMethodTwoElse: string;
  argsOneElse: string;
  argsTwoElse: string;
  color: string;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  onSubmit,
  onOpenEventsModal,
  onClose,
  isData,
  isName,
  editor,
  ...props
}) => {
  const {
    register,
    reset,
    handleSubmit: hookHandleSubmit,
    formState: { errors },
  } = useForm<CreateModalFormValues>({
    defaultValues: {
      color: '#ffffff',
    },
  });

  //--------------------------------Работа со списком компонентов---------------------------------------
  const machine = editor!.container.machine;
  const [eventMethods, setEventMethods] = useState<string>();
  const [param1Variables, setParam1Variables] = useState<string>();
  const [param2Variables, setParam2Variables] = useState<string>();
  //-----------------------------------------------------------------------------------------------------

  //-----------------------------Функция для закрытия модального окна-----------------------------------
  const onRequestClose = () => {
    onClose();
    // TODO: пока кажется лишним затирать текстовые поля
    reset({ color: '#ffffff' });
  };
  //-----------------------------------------------------------------------------------------------------

  //----------------------------------Добавление новых событий------------------------------------------
  const condition = props.isCondition;

  //-----------------------------------------------------------------------------------------------------

  //-----------------------------Функция на нажатие кнопки "Сохранить"-----------------------------------
  const handleSubmit = hookHandleSubmit((data) => {
    isName !== undefined
      ? ((data.id = isName?.state.id), data.name || (data.name = 'Состояние'), (data.key = 1))
      : isData !== undefined
      ? ((data.id = isData?.state.id), (data.name = isData?.state.data.name), (data.key = 2))
      : (data.key = 3);
    onSubmit(data);
  });
  //-----------------------------------------------------------------------------------------------------

  //----------------------Стили позиционирования для переименования состояния----------------------------
  const inputStyle = {
    left: isName?.position.x + 'px',
    top: isName?.position.y + 'px',
    width: isName?.position.width + 'px',
    height: isName?.position.height + 'px',
  };
  //-----------------------------------------------------------------------------------------------------

  //-------------------------------Реализация показа блоков условия--------------------------------------
  const [isElse, setIsElse] = useState(true);
  const [isParamOne, setIsParamOne] = useState(true);
  const [isParamTwo, setIsParamTwo] = useState(true);
  const handleIsElse = (event) => {
    if (event.target.checked) {
      setIsElse(false);
    } else {
      setIsElse(true);
    }
  };
  const handleParamOne = (event) => {
    if (event.target.checked) {
      setIsParamOne(false);
    } else {
      setIsParamOne(true);
    }
  };
  const handleParamTwo = (event) => {
    if (event.target.checked) {
      setIsParamTwo(false);
    } else {
      setIsParamTwo(true);
    }
  };
  //-----------------------------------------------------------------------------------------------------

  const selectElse = ['>', '<', '=', '!=', '>=', '<='];
  return (
    //-------------------------------------Переименование состояния-----------------------------------------
    <>
      {isName !== undefined ? (
        <>
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
        </>
      ) : (
        //--------------------------------------Показ модального окна------------------------------------------
        <>
          <Modal
            {...props}
            onRequestClose={onRequestClose}
            title={
              isData?.state.id !== undefined
                ? 'Редактирование состояния: ' + JSON.stringify(isData?.state.data.name)
                : 'Редактор соединения'
            }
            onSubmit={handleSubmit}
            submitLabel="Сохранить"
          >
            {/*---------------------------------Добавление основного события-------------------------------------*/}
            <div className="flex items-center">
              <label className="mx-1">Когда: </label>
              <TextSelect
                label="Компонент(событие):"
                {...register('triggerComponent', {
                  onChange(event) {
                    setEventMethods(event.target.value);
                  },
                })}
                machine={machine}
                isElse={false}
              />
              <TextSelect
                label="Действие:"
                {...register('triggerMethod', {})}
                machine={machine}
                isElse={false}
                content={eventMethods}
              />
            </div>
            {/*--------------------------------------Добавление условия------------------------------------------*/}
            <div className="flex items-start">
              <div className="my-3 flex items-center">
                <label className="mx-1">Если: </label>
                <label
                  className={twMerge(
                    'my-2 ml-3 select-none rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-500',
                    !isElse && 'bg-neutral-500'
                  )}
                >
                  <input type="checkbox" onChange={handleIsElse} className="h-0 w-0 opacity-0" />
                  <span>Условие</span>
                </label>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    onChange={handleParamOne}
                    className={twMerge('mx-2', isElse && 'hidden')}
                  />
                  {isParamOne ? (
                    <>
                      <TextSelect
                        label="Компонент(событие):"
                        {...register('doComponentOneElse', {
                          onChange(event) {
                            setParam1Variables(event.target.value);
                          },
                        })}
                        machine={machine}
                        isElse={isElse}
                      />
                      <TextSelect
                        label="Действие:"
                        {...register('doMethodOneElse', {})}
                        machine={machine}
                        isElse={isElse}
                        content={param1Variables}
                      />
                    </>
                  ) : (
                    <TextInput
                      label="Параметр:"
                      placeholder="Напишите параметр"
                      {...register('argsOneElse', {
                        required: 'Это поле обязательно к заполнению!',
                      })}
                      isElse={isElse}
                      error={!!errors.argsOneElse}
                      errorMessage={errors.argsOneElse?.message ?? ''}
                    />
                  )}
                </div>
                <select
                  className={twMerge(
                    'mb-4 ml-8 w-[60px] rounded border bg-transparent px-1 py-1 text-white',
                    isElse && 'hidden'
                  )}
                >
                  {selectElse.map((content) => (
                    <option
                      key={'option' + content}
                      className="bg-neutral-800"
                      value={content}
                      label={content}
                    ></option>
                  ))}
                </select>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    disabled={isElse}
                    onChange={handleParamTwo}
                    className={twMerge('mx-2', isElse && 'hidden')}
                  />
                  {isParamTwo ? (
                    <>
                      <TextSelect
                        label="Компонент(событие):"
                        {...register('doComponentTwoElse', {
                          onChange(event) {
                            setParam2Variables(event.target.value);
                          },
                        })}
                        machine={machine}
                        isElse={isElse}
                      />
                      <TextSelect
                        label="Действие:"
                        {...register('doMethodTwoElse', {})}
                        machine={machine}
                        isElse={isElse}
                        content={param2Variables}
                      />
                    </>
                  ) : (
                    <TextInput
                      label="Параметр:"
                      placeholder="Напишите параметр"
                      {...register('argsTwoElse', {
                        required: 'Это поле обязательно к заполнению!',
                      })}
                      isElse={isElse}
                      error={!!errors.argsTwoElse}
                      errorMessage={errors.argsTwoElse?.message ?? ''}
                    />
                  )}
                </div>
              </div>
            </div>
            {/*-------------------------------------Добавление действий-----------------------------------------*/}
            <div className="flex">
              <label className="mx-1">Делай: </label>
              <div className="ml-1 mr-2 flex h-36 w-full flex-col overflow-y-auto break-words rounded bg-neutral-700 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#FFFFFF] scrollbar-thumb-rounded-full">
                {condition === undefined ||
                  condition!.map((data, key) => (
                    <div className="flex items-center">
                      <div
                        key={'newEvent' + key}
                        //draggable
                        className={twMerge(
                          'm-2 flex min-h-[3rem] w-36 justify-around rounded-full border-2 bg-neutral-700 px-1'
                        )}
                      >
                        <div className="h-full border-2 border-white"></div>
                      </div>
                      <div>{data.component}.</div>
                      <div>{data.method}</div>
                      {data.args !== undefined || <div>{data.args}</div>}
                    </div>
                  ))}
              </div>
              <div className="flex flex-col">
                <button
                  type="button"
                  className="rounded bg-neutral-700 px-1 py-1 transition-colors hover:bg-neutral-600"
                  onClick={onOpenEventsModal}
                >
                  <AddIcon />
                </button>
                <button
                  type="button"
                  className="my-2 rounded bg-neutral-700 px-1 py-1 transition-colors hover:bg-neutral-600"
                  onClick={onOpenEventsModal}
                >
                  <SubtractIcon />
                </button>
              </div>
            </div>

            {isData !== undefined || (
              <>
                <ColorInput
                  label="Цвет связи:"
                  {...register('color', { required: 'Это поле обязательно к заполнению!' })}
                  error={!!errors.color}
                  errorMessage={errors.color?.message ?? ''}
                />
              </>
            )}
          </Modal>
        </>
      )}
    </>
  );
};

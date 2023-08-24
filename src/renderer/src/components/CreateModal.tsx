import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { ColorInput } from './Modal/ColorInput';
import { Modal } from './Modal/Modal';
import { twMerge } from 'tailwind-merge';
import { SelectEntry, TextSelect } from './Modal/TextSelect';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { TextInput } from './Modal/TextInput';
import { Action, Condition } from '@renderer/types/diagram';
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
  else: Condition;
  //Массив вторичных событий
  condition: Action[];
  //Данные вторичного событий
  doComponent: string;
  doMethod: string;
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

  //Массив первого select
  const [eventComponents, setEventComponents] = useState<SelectEntry[]>([]);
  const [param1Components, setParam1Components] = useState<SelectEntry[]>([]);
  const [param2Components, setParam2Components] = useState<SelectEntry[]>([]);
  const [eventMethods, setEventMethods] = useState<string>();
  const [param1Variables, setParam1Variables] = useState<string>();
  const [param2Variables, setParam2Variables] = useState<string>();

  useEffect(() => {
    if (eventMethods === undefined) {
      setEventComponents(
        Array.from(machine.components.entries()).map(([idx, _component]) => {
          return { idx, name: idx, img: machine.platform.getComponentIconUrl(idx) };
        })
      );
      eventComponents.find((value, idx) => {
        if (idx === 0) {
          setEventMethods(value.name);
        }
      });
    }

    if (param1Variables === undefined) {
      setParam1Components(
        Array.from(machine.components.entries()).map(([idx, _component]) => {
          return { idx, name: idx, img: machine.platform.getComponentIconUrl(idx) };
        })
      );
      param1Components.find((value, idx) => {
        if (idx === 0) {
          setParam1Variables(value.name);
        }
      });
    }

    if (param2Variables === undefined) {
      setParam2Components(
        Array.from(machine.components.entries()).map(([idx, _component]) => {
          return { idx, name: idx, img: machine.platform.getComponentIconUrl(idx) };
        })
      );
      param2Components.find((value, idx) => {
        if (idx === 0) {
          setParam2Variables(value.name);
        }
      });
    }
  }, [props.isOpen]);

  //-----------------------------------------------------------------------------------------------------

  //-----------------------------Функция для закрытия модального окна-----------------------------------
  const onRequestClose = () => {
    onClose();
    // TODO: пока кажется лишним затирать текстовые поля
    reset({ color: '#ffffff' });
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

  //-----------------------------Функция на нажатие кнопки "Сохранить"-----------------------------------
  const [type, setType] = useState<string>();
  const handleSubmit = hookHandleSubmit((data) => {
    isName !== undefined
      ? ((data.id = isName?.state.id), data.name || (data.name = 'Состояние'), (data.key = 1))
      : isData !== undefined
      ? ((data.id = isData?.state.id), (data.name = isData?.state.data.name), (data.key = 2))
      : (data.key = 3);
    data.else = {
      type: type!,
      value: [
        isParamOne
          ? {
              type: 'component',
              value: {
                component: data.doComponentOneElse,
                method: data.doMethodOneElse,
                args: {},
              },
            }
          : {
              type: 'value',
              value: data.argsOneElse,
            },
        isParamOne
          ? {
              type: 'component',
              value: {
                component: data.doComponentOneElse,
                method: data.doMethodOneElse,
                args: {},
              },
            }
          : {
              type: 'value',
              value: data.argsOneElse,
            },
      ],
    };
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

  const selectElse = [
    {
      type: 'more',
      icon: '>',
    },
    {
      type: 'less',
      icon: '<',
    },
    {
      type: 'equals',
      icon: '=',
    },
    {
      type: 'notEquals',
      icon: '!=',
    },
    {
      type: 'moreOrEqual',
      icon: '>=',
    },
    {
      type: 'lessOrEqual',
      icon: '<=',
    },
  ];
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
                isElse={false}
                machine={machine}
                data={eventComponents}
              />
              <TextSelect
                label="Действие:"
                {...register('triggerMethod', {})}
                isElse={false}
                machine={machine}
                data={eventMethods}
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
                        data={param1Components}
                      />
                      <TextSelect
                        label="Действие:"
                        {...register('doMethodOneElse', {})}
                        machine={machine}
                        isElse={isElse}
                        data={param1Variables}
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
                  ref={(event) => {
                    if (event !== null) {
                      setType(event.value);
                    }
                  }}
                >
                  {selectElse.map((content) => (
                    <option
                      key={'option' + content.type}
                      className="bg-neutral-800"
                      value={content.type}
                      label={content.icon}
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
                        data={param2Components}
                        value={param2Variables}
                      />
                      <TextSelect
                        label="Действие:"
                        {...register('doMethodTwoElse', {})}
                        machine={machine}
                        isElse={isElse}
                        data={param2Variables}
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
                {props.isCondition === undefined ||
                  props.isCondition.map((data, key) => (
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

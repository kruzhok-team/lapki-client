import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { ColorInput } from './Modal/ColorInput';
import { Modal } from './Modal/Modal';
import { twMerge } from 'tailwind-merge';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { TextInput } from './Modal/TextInput';
import { Action, Condition } from '@renderer/types/diagram';
import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import UnknownIcon from '@renderer/assets/icons/unknown.svg';
import Select from 'react-select';

interface CreateModalProps {
  isOpen: boolean;
  editor: CanvasEditor | null;
  isData: { state } | undefined;
  isCondition: Action[] | undefined;
  setIsCondition: React.Dispatch<React.SetStateAction<Action[]>>;
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
    formState: { errors },
  } = useForm<CreateModalFormValues>();

  //--------------------------------Работа со списком компонентов---------------------------------------
  const machine = editor!.container.machine;

  const optionsComponents = [
    {
      value: 'System',
      label: (
        <div className="flex items-center">
          <img
            src={machine.platform.getComponentIconUrl('System', true)}
            className="mr-1 h-7 w-7"
          />
          {'System'}
        </div>
      ),
    },
    ...Array.from(machine.components.entries()).map(([idx, _component]) => {
      return {
        value: idx,
        label: (
          <div className="flex items-center">
            <img src={machine.platform.getComponentIconUrl(idx, true)} className="mr-1 h-7 w-7" />
            {idx}
          </div>
        ),
      };
    }),
  ];

  const optionsParam1Components = Array.from(machine.components.entries()).map(
    ([idx, _component]) => {
      return {
        value: idx,
        label: (
          <div className="flex items-center">
            <img src={machine.platform.getComponentIconUrl(idx, true)} className="mr-1 h-7 w-7" />
            {idx}
          </div>
        ),
      };
    }
  );

  const optionsParam2Components = Array.from(machine.components.entries()).map(
    ([idx, _component]) => {
      return {
        value: idx,
        label: (
          <div className="flex items-center">
            <img src={machine.platform.getComponentIconUrl(idx, true)} className="mr-1 h-7 w-7" />
            {idx}
          </div>
        ),
      };
    }
  );

  const [components, setComponents] = useState(optionsComponents[0]);
  const [param1Components, setParam1Components] = useState(optionsParam1Components[0]);
  const [param2Components, setParam2Components] = useState(optionsParam1Components[0]);

  const optionsMethods =
    machine.platform.getAvailableMethods(components.value).length !== 0
      ? machine.platform.getAvailableMethods(components.value).map((entry) => {
          return {
            value: entry.name,
            label: (
              <div className="flex items-center">
                <img
                  src={machine.platform.getActionIconUrl(components.value, entry.name, true)}
                  className="mr-1 h-7 w-7"
                />
                {entry.name}
              </div>
            ),
          };
        })
      : machine.platform.getAvailableEvents(components.value).map((entry) => {
          return {
            value: entry.name,
            label: (
              <div className="flex items-center">
                <img
                  src={machine.platform.getEventIconUrl(components.value, entry.name, true)}
                  className="mr-1 h-7 w-7"
                />
                {entry.name}
              </div>
            ),
          };
        });
  const optionsParam1Methods =
    machine.platform.getAvailableMethods(param1Components.value).length !== 0
      ? machine.platform.getAvailableMethods(param1Components.value).map((entry) => {
          return {
            value: entry.name,
            label: (
              <div className="flex items-center">
                <img
                  src={machine.platform.getActionIconUrl(param1Components.value, entry.name, true)}
                  className="mr-1 h-7 w-7"
                />
                {entry.name}
              </div>
            ),
          };
        })
      : machine.platform.getAvailableEvents(param1Components.value).map((entry) => {
          return {
            value: entry.name,
            label: (
              <div className="flex items-center">
                <img
                  src={machine.platform.getEventIconUrl(param1Components.value, entry.name, true)}
                  className="mr-1 h-7 w-7"
                />
                {entry.name}
              </div>
            ),
          };
        });
  const optionsParam2Methods =
    machine.platform.getAvailableMethods(param2Components.value).length !== 0
      ? machine.platform.getAvailableMethods(param2Components.value).map((entry) => {
          return {
            value: entry.name,
            label: (
              <div className="flex items-center">
                <img
                  src={machine.platform.getActionIconUrl(param2Components.value, entry.name, true)}
                  className="mr-1 h-7 w-7"
                />
                {entry.name}
              </div>
            ),
          };
        })
      : machine.platform.getAvailableEvents(param2Components.value).map((entry) => {
          return {
            value: entry.name,
            label: (
              <div className="flex items-center">
                <img
                  src={machine.platform.getEventIconUrl(param2Components.value, entry.name, true)}
                  className="mr-1 h-7 w-7"
                />
                {entry.name}
              </div>
            ),
          };
        });
  const [methods, setMethods] = useState(optionsMethods[0]);
  const [param1Methods, setParam1Methods] = useState(optionsParam1Methods[0]);
  const [param2Methods, setParam2Methods] = useState(optionsParam2Methods[0]);

  useEffect(() => {
    setMethods(optionsMethods[0]);
  }, [components]);

  useEffect(() => {
    setParam1Methods(optionsParam1Methods[0]);
  }, [param1Components]);

  useEffect(() => {
    setParam2Methods(optionsParam2Methods[0]);
  }, [param2Components]);
  //-----------------------------------------------------------------------------------------------------

  //-----------------------------Функция для закрытия модального окна-----------------------------------
  const onRequestClose = () => {
    onClose();
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
  var method = props.isCondition!;
  //-----------------------------Функция на нажатие кнопки "Сохранить"-----------------------------------
  const [type, setType] = useState<string>();
  const handleSubmit = (ev) => {
    ev.preventDefault();

    const data = {
      id: isName ? isName?.state.id : isData !== undefined && isData?.state.id,
      name: isName ? 'Состояние' : isData !== undefined && isData?.state.data.name,
      key: isName ? 1 : isData ? 2 : 3,
      triggerComponent: components.value,
      triggerMethod: methods.value,
      else: {
        type: type!,
        value: [
          {
            type: isParamOne ? 'component' : 'value',
            value: isParamOne
              ? {
                  component: param1Components.value,
                  method: param1Methods.value,
                  args: {},
                }
              : { argsOneElse: '5' },
          },
          {
            type: isParamTwo ? 'component' : 'value',
            value: isParamTwo
              ? {
                  component: param2Components.value,
                  method: param2Methods.value,
                  args: {},
                }
              : { argsTwoElse: '5' },
          },
        ],
      },
      condition: method,
      argsOneElse: { args: '5' },
      argsTwoElse: { args: '5' },
      color: 'FFFFFF',
    };
    //Это ошибка требуется большого внимания, но вглядываться в типы я пока не стал, пока и без этого работает
    onSubmit(data);
  };
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
      type: 'greater',
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
      type: 'greaterOrEqual',
      icon: '>=',
    },
    {
      type: 'lessOrEqual',
      icon: '<=',
    },
  ];

  //Ниже реализовано перетаскивание событий между собой

  const [dragId, setDragId] = useState();
  const handleDrag = (id) => {
    setDragId(id);
    console.log(id);
  };

  const handleDrop = (id) => {
    const dragBox = method.find((_box, index) => index === dragId);
    const dropBox = method.find((_box, index) => index === id);

    const dragBoxOrder = dragBox;
    const dropBoxOrder = dropBox;

    const newBoxState = method.map((box, index) => {
      if (index === dragId) {
        box = dropBoxOrder!;
      }
      if (index === id) {
        box = dragBoxOrder!;
      }
      return box;
    });
    props.setIsCondition(newBoxState);
  };

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
                handleSubmit;
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
              <Select
                className="mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1"
                options={optionsComponents}
                onChange={(event) => setComponents(event!)}
                value={components}
                isSearchable={false}
              />
              <Select
                className="mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1"
                options={optionsMethods}
                onChange={(event) => setMethods(event!)}
                value={methods}
                isSearchable={false}
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
                      <Select
                        className={twMerge(
                          'mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1',
                          isElse && 'hidden'
                        )}
                        options={optionsParam1Components}
                        onChange={(event) => setParam1Components(event!)}
                        value={param1Components}
                        isSearchable={false}
                      />
                      <Select
                        className={twMerge(
                          'mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1',
                          isElse && 'hidden'
                        )}
                        options={optionsParam1Methods}
                        onChange={(event) => setParam1Methods(event!)}
                        value={param1Methods}
                        isSearchable={false}
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
                      <Select
                        className={twMerge(
                          'mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1',
                          isElse && 'hidden'
                        )}
                        options={optionsParam2Components}
                        onChange={(event) => setParam2Components(event!)}
                        value={param2Components}
                        isSearchable={false}
                      />
                      <Select
                        className={twMerge(
                          'mb-6 h-[34px] w-[200px] max-w-[200px] px-2 py-1',
                          isElse && 'hidden'
                        )}
                        options={optionsParam2Methods}
                        onChange={(event) => setParam2Methods(event!)}
                        value={param2Methods}
                        isSearchable={false}
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
                {method === undefined ||
                  method.map((data, key) => (
                    <div
                      className="flex"
                      draggable={true}
                      onDragOver={(event) => event.preventDefault()}
                      onDragStart={() => handleDrag(key)}
                      onDrop={() => handleDrop(key)}
                    >
                      <div
                        key={'newEvent' + key}
                        //draggable
                        className={twMerge(
                          'm-2 flex min-h-[3rem] w-36 items-center justify-around rounded-lg border-2 bg-neutral-700 px-1'
                        )}
                      >
                        <img
                          style={{ height: '32px', width: '32px' }}
                          src={machine.platform.getComponentIconUrl(data.component, true)}
                        />
                        <div className="h-full border-2 border-white"></div>
                        <img
                          style={{ height: '32px', width: '32px' }}
                          src={
                            machine.platform.getAvailableMethods(data.component).length !== 0
                              ? machine.platform.getActionIconUrl(data.component, data.method, true)
                              : machine.platform.getEventIconUrl(data.component, data.method, true)
                          }
                        />
                      </div>
                      <div className="flex items-center">
                        <div>{data.component}.</div>
                        <div>{data.method}</div>
                      </div>

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

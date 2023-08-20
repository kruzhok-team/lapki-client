import React, { useState } from 'react';
import ReactModal, { Props } from 'react-modal';

import './Modal/style.css';
import { TextSelect } from './Modal/TextSelect';
import { EventSelection } from '../lib/drawable/Events';
import { useForm } from 'react-hook-form';
import { TextInput } from './Modal/TextInput';
import { Action } from '@renderer/types/diagram';
import { State } from '@renderer/lib/drawable/State';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

interface EventsModalProps extends Props {
  editor: CanvasEditor | null;
  isData: { state: State; event: EventSelection; click: boolean } | undefined;
  cancelLabel?: string;
  submitLabel?: string;
  onSubmit: (data: EventsModalFormValues) => void;
  onClose: () => void;
}

export interface EventsModalFormValues {
  id: { state; event: EventSelection } | undefined;
  doComponent: string;
  doMethod: string;
  doArgs: { [key: string]: string } | undefined;
  condition: Action[];
}

export const CreateEventsModal: React.FC<EventsModalProps> = ({
  cancelLabel,
  submitLabel,
  onSubmit,
  onClose,
  ...props
}) => {
  const {
    register,
    handleSubmit: hookHandleSubmit,
    formState: { errors },
  } = useForm<EventsModalFormValues>();

  const components = props.editor?.container.machine.components;
  const methods = props.editor?.container.machine.platform.getAvailableEvents('Button');
  console.log(components, methods);

  const [condition, setCondition] = useState<
    { component: string; method: string; args?: { [key: string]: string } }[]
  >([]);

  // //функция для создания новых действий
  // const onCreateEvents = hookHandleSubmit((data) => {
  //   setCondition([
  //     ...condition,
  //     {
  //       component: data.doComponent,
  //       method: data.doMethod,
  //       args: data.doArgs,
  //     },
  //   ]);
  // });

  const handleSubmit = hookHandleSubmit((data) => {
    setCondition([
      ...condition,
      {
        component: data.doComponent,
        method: data.doMethod,
        args: data.doArgs,
      },
    ]);
    data.id = props.isData;
    data.condition = condition;
    onSubmit(data);
  });

  //Ниже будет реализована функция для обработки перетаскивания событий между собой, надо будет перетащить его в другую модалку

  /* const [dragId, setDragId] = useState();
    const handleDrag = (ev) => {
    setDragId(ev.currentTarget.id);
    }; 
  */

  return (
    <ReactModal
      {...props}
      className="absolute left-1/2 top-12 w-full max-w-sm -translate-x-1/2 rounded-lg bg-neutral-800 p-6 font-Fira text-neutral-100 outline-none"
      overlayClassName="bg-neutral-700 fixed inset-0 backdrop-blur z-50"
      onRequestClose={onClose}
    >
      <div className="relative mb-3 justify-between border-b border-neutral-400 pb-1">
        <h1 className="text-2xl font-bold">Редактирование события</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col items-center">
          <TextSelect
            label="Компонент(событие):"
            {...register('doComponent', {
              required: 'Это поле обязательно к заполнению!',
            })}
            isElse={false}
            error={!!errors.doComponent}
            errorMessage={errors.doComponent?.message ?? ''}
          />
          <TextSelect
            label="Действие:"
            {...register('doMethod', {
              required: 'Это поле обязательно к заполнению!',
            })}
            isElse={false}
            error={!!errors.doMethod}
            errorMessage={errors.doMethod?.message ?? ''}
          />
          <TextInput
            label="Параметр:"
            placeholder="Напишите параметр"
            {...register('doArgs', {
              required: 'Это поле обязательно к заполнению!',
            })}
            isElse={false}
            error={!!errors.doArgs}
            // FIXME: некритичная ошибка по типам
            // @ts-ignore
            errorMessage={errors.doArgs?.message ?? ''}
          />
        </div>
        {/* {!props.isData?.click && (
            <button
              type="button"
              className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
              onClick={onCreateEvents}
            >
              Добавить
            </button>
          )}
        
        {!props.isData?.click && (
          <div className="m-2 flex h-48 max-w-lg flex-col items-center overflow-y-auto break-words rounded bg-neutral-700">
            {condition.map((data, key) => (
              <div
                key={'newEvent' + key}
                draggable
                className={twMerge(
                  'm-2 flex min-h-[3.5rem] w-40 items-center justify-around rounded border-2 bg-neutral-700 px-1' key && 'order-'+{key}
                )}
              >
                <div>{data.component}</div>
                <div className="h-full border-2 border-white"></div>
                <div>{data.method}</div>
                {data.args !== undefined || <div>{data.args}</div>}
              </div>
            ))}
          </div>
        )} */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded px-4 py-2 text-neutral-400 transition-colors hover:text-neutral-50"
            onClick={onClose}
          >
            {cancelLabel ?? 'Закрыть'}
          </button>
          <button
            type="submit"
            className="rounded bg-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-600"
            hidden={!onSubmit}
          >
            {submitLabel ?? 'Сохранить'}
          </button>
        </div>
      </form>
    </ReactModal>
  );
};

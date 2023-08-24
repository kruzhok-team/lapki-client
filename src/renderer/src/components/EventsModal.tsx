import React, { useEffect, useState } from 'react';
import ReactModal, { Props } from 'react-modal';

import './Modal/style.css';
import { SelectEntry, TextSelect } from './Modal/TextSelect';
import { EventSelection } from '../lib/drawable/Events';
import { useForm } from 'react-hook-form';
import { TextInput } from './Modal/TextInput';
import { Action } from '@renderer/types/diagram';
import { State } from '@renderer/lib/drawable/State';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

interface EventsModalProps extends Props {
  editor: CanvasEditor | null;
  isData: { state: State; event: EventSelection; click: boolean } | undefined;
  isOpen: boolean;
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
  condition: Action;
}

export const CreateEventsModal: React.FC<EventsModalProps> = ({
  cancelLabel,
  submitLabel,
  onSubmit,
  onClose,
  editor,
  ...props
}) => {
  const {
    register,
    handleSubmit: hookHandleSubmit,
    formState: { errors },
  } = useForm<EventsModalFormValues>();

  const machine = editor!.container.machine;
  //Массив первого select
  const [eventComponents, setEventComponents] = useState<SelectEntry[]>([]);
  const [nameComponents, setNameComponents] = useState<string>();
  const [nameMethods, setNameMethods] = useState<string>();

  useEffect(() => {
    if (nameComponents === undefined) {
      setEventComponents(
        Array.from(machine.components.entries()).map(([idx, _component]) => {
          return { idx, name: idx, img: machine.platform.getComponentIconUrl(idx) };
        })
      );
      //Находим первый элемент массива для стабильной работы первого select
      eventComponents.find((value, idx) => {
        if (idx === 0) {
          setNameComponents(value.name);
        }
      });
    }
  }, [props.isOpen]);

  const handleSubmit = hookHandleSubmit((data) => {
    data.id = props.isData;
    (data.condition = {
      component: data.doComponent,
      method: data.doMethod,
      args: data.doArgs,
    }),
      onSubmit(data);
  });

  return (
    <ReactModal
      {...props}
      className="absolute left-1/2 top-12 w-full max-w-sm -translate-x-1/2 rounded-lg bg-neutral-800 p-6 text-neutral-100 outline-none"
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
              //validate: (value) => value === nameComponents,
              onChange(event) {
                setNameComponents(event.target.value);
              },
              value: nameComponents,
            })}
            isElse={false}
            data={eventComponents}
          />
          <TextSelect
            label="Действие:"
            {...register('doMethod', {
              onChange(event) {
                setNameMethods(event.target.value);
              },
              value: nameMethods,
            })}
            machine={machine}
            isElse={false}
            data={nameComponents}
          />
          {/* <TextInput
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
          /> */}
        </div>
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

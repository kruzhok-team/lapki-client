import { StateMachine } from '@renderer/lib/data/StateMachine';
import { useEffect, useState, forwardRef, ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

export interface SelectEntry {
  idx: string;
  name: string;
  img?: string;
}

interface TextSelectProps extends ComponentProps<'select'> {
  label: string;
  machine: StateMachine;
  content?: string | undefined;
  isElse: boolean;
}

export const TextSelect = forwardRef<HTMLSelectElement, TextSelectProps>(
  ({ label, machine, content, isElse, ...props }, ref) => {
    const [eventComponents, setEventComponents] = useState<SelectEntry[]>([]);

    useEffect(() => {
      if (content === undefined) {
        setEventComponents(
          Array.from(machine.components.entries()).map(([idx, _component]) => {
            return { idx, name: idx, img: machine.platform.getComponentIconUrl(idx) };
          })
        );
      } else {
        if (machine.platform.getAvailableMethods(content).length !== 0) {
          setEventComponents(
            machine.platform.getAvailableMethods(content).map((entry) => {
              return { idx: entry.name, name: entry.name, img: entry.img };
            })
          );
        } else {
          setEventComponents(
            machine.platform.getAvailableEvents(content).map((entry) => {
              return { idx: entry.name, name: entry.name, img: entry.img };
            })
          );
        }
      }
    }, [content]);

    return (
      <label className={twMerge('mx-1 flex flex-col ', isElse && 'hidden')}>
        {label}
        <select
          className={twMerge(
            'mb-4 h-[34px] w-[200px] max-w-[200px] rounded border bg-transparent px-2 py-1 outline-none transition-colors'
          )}
          ref={ref}
          {...props}
          required
        >
          {eventComponents.map((option, _key) => (
            <option
              className="bg-neutral-800"
              key={'option' + option.name}
              value={option.name}
              label={option.name}
            >
              {/*option.img ? <img style={{ height: '16px' }} src={option.img} /> : ''*/}
            </option>
          ))}
        </select>
      </label>
    );
  }
);

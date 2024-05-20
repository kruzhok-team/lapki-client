import { ReactComponent as InitialStateIcon } from '@renderer/assets/icons/arrow_down_right.svg';
import { ReactComponent as FinalStateIcon } from '@renderer/assets/icons/final_state.svg';
import { ReactComponent as NoteIcon } from '@renderer/assets/icons/note.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state.svg';
import { ReactComponent as TransitionIcon } from '@renderer/assets/icons/transition-alt.svg';

import { WithHint } from '../UI';

interface TitleRenderProps {
  title: string;
  search: string;
  type: 'state' | 'initialState' | 'finalState' | 'transition' | 'note';
}

const icons = {
  state: StateIcon,
  initialState: InitialStateIcon,
  transition: TransitionIcon,
  finalState: FinalStateIcon,
  note: NoteIcon,
};
/* Отрисовка заголовка ноды в иерархии состояний, можно подсвечивать подстроку (для отображения поиска) */
export const TitleRender: React.FC<TitleRenderProps> = (props) => {
  const { type, title, search } = props;

  const Icon = icons[type];

  const parts = search ? title.split(new RegExp(`(${search})`, 'gi')) : [title];

  return (
    <div className="group flex w-full items-center gap-2">
      <WithHint hint={title} placement="right" offset={5} delay={100}>
        {(props) => (
          <div {...props} className="flex w-full items-center gap-1">
            <div className="text-[#737373]">
              <Icon className="h-6 w-6" />
            </div>

            <span className="line-clamp-1">
              {parts.map((part, i) => (
                <span
                  key={i}
                  data-highlight={part.trim().toLowerCase() === search.trim().toLowerCase()}
                  className="data-[highlight=true]:text-text-highlighted"
                >
                  {part}
                </span>
              ))}
            </span>
          </div>
        )}
      </WithHint>
    </div>
  );
};

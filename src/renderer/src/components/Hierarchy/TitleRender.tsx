import { ReactComponent as InitialStateIcon } from '@renderer/assets/icons/arrow_down_right.svg';
import { ReactComponent as ChoiceStateIcon } from '@renderer/assets/icons/choice_state.svg';
import { ReactComponent as FinalStateIcon } from '@renderer/assets/icons/final_state.svg';
import { ReactComponent as NoteIcon } from '@renderer/assets/icons/note.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state.svg';
import { ReactComponent as TransitionIcon } from '@renderer/assets/icons/transition-alt.svg';

import { HierarchyItemData } from './Hierarchy';

import { WithHint } from '../UI';

interface TitleRenderProps extends HierarchyItemData {
  search: string;
}

const icons: Record<
  HierarchyItemData['type'],
  React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
    }
  >
> = {
  state: StateIcon,
  initialState: InitialStateIcon,
  transition: TransitionIcon,
  finalState: FinalStateIcon,
  note: NoteIcon,
  choiceState: ChoiceStateIcon,
};

/* Отрисовка заголовка ноды в иерархии состояний, можно подсвечивать подстроку (для отображения поиска) */
export const TitleRender: React.FC<TitleRenderProps> = (props) => {
  const { type, title, search } = props;

  const Icon = icons[type];

  const parts = search ? title.split(new RegExp(`(${search})`, 'gi')) : [title.toString()];

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

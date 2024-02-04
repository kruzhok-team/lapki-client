import { ReactComponent as InitialStateIcon } from '@renderer/assets/icons/arrow_down_right.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state.svg';
import { ReactComponent as TransitionIcon } from '@renderer/assets/icons/transition-alt.svg';

import { WithHint } from '../UI';

interface BaseTitleRenderProps {
  title: string;
  search: string;
}

interface TransitionTitleRenderProps extends BaseTitleRenderProps {
  type: 'transition';
}

interface StateTitleRenderProps extends BaseTitleRenderProps {
  type: 'state';
  isInitial: boolean;
}

type TitleRenderProps = TransitionTitleRenderProps | StateTitleRenderProps;

const icons = {
  state: StateIcon,
  transition: TransitionIcon,
};

export const TitleRender: React.FC<TitleRenderProps> = (props) => {
  const { type, title, search } = props;

  const Icon = icons[type];

  const parts = search ? title.split(new RegExp(`(${search})`, 'gi')) : [title];

  return (
    <div className="group flex w-full items-center gap-2">
      <WithHint hint={title} placement="right" offset={5} delay={100}>
        {(props) => (
          <div {...props} className="flex w-full items-center gap-1">
            <Icon className="h-6 w-6" />

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

      {type === 'state' && props.isInitial && (
        <WithHint hint="Начальное состояние" placement="right" offset={5} delay={100}>
          {(props) => (
            <div {...props}>
              <InitialStateIcon className="h-5 w-5" />
            </div>
          )}
        </WithHint>
      )}
    </div>
  );
};

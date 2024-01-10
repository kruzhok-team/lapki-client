import { twMerge } from 'tailwind-merge';

import { ReactComponent as InitialStateIcon } from '@renderer/assets/icons/arrow_down_right.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state.svg';
import { ReactComponent as TransitionIcon } from '@renderer/assets/icons/transition.svg';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

import { WithHint } from '../UI';

export const TitleRender: React.FC<{
  data;
  editor: CanvasEditor | null;
  initialState: string | undefined;
}> = ({ data, editor, initialState }) => {
  return (
    <span className="flex w-full justify-between">
      <WithHint hint={data.title} placement="right" offset={5} delay={100}>
        {(props) => (
          <div {...props} className="flex">
            <div className="w-6">
              {editor &&
              editor.container.machineController.states.get(data.item.index.toString()) ? (
                <StateIcon width={24} height={24} />
              ) : (
                <TransitionIcon width={24} height={24} />
              )}
            </div>

            <span className="mx-1 line-clamp-1">{data.title}</span>
          </div>
        )}
      </WithHint>

      <div className={twMerge('block w-6', initialState !== data.item.index && 'hidden')}>
        <InitialStateIcon width={24} height={24} />
      </div>
    </span>
  );
};

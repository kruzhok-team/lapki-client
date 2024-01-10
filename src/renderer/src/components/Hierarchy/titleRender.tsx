import { ReactComponent as InitialStateIcon } from '@renderer/assets/icons/arrow_down_right.svg';
import { ReactComponent as StateIcon } from '@renderer/assets/icons/state.svg';
import { ReactComponent as TransitionIcon } from '@renderer/assets/icons/transition.svg';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';

export const TitleRender: React.FC<{
  props;
  editor: CanvasEditor | null;
  initialState: string | undefined;
}> = ({ props, editor, initialState }) => {
  return (
    <span className="flex w-full justify-between">
      <div className="flex">
        {editor && editor.container.machineController.states.get(props.item.index.toString()) ? (
          <StateIcon width={24} height={24} />
        ) : (
          <TransitionIcon width={24} height={24} />
        )}
        <span title={props.title} className="ml-1 line-clamp-1">
          {props.title}
        </span>
      </div>
      {initialState === props.item.index && <InitialStateIcon width={24} height={24} />}
    </span>
  );
};

import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
} from '@floating-ui/react';

interface StateContextMenuProps {
  isOpen: boolean;
  setIsOpen: any;
  x: any;
}
export const StateContextMenu: React.FC<StateContextMenuProps> = ({ isOpen, setIsOpen }) => {
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  // Merge all the interactions into prop getters
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return (
    <>
      <div ref={refs.setFloating}>
        <button {...getReferenceProps()}>Reference element</button>
        {isOpen && (
          <FloatingFocusManager context={context} modal={false}>
            <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
              Popover element
            </div>
          </FloatingFocusManager>
        )}
      </div>
    </>
  );
};

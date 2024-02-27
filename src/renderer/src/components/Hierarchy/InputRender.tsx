export const InputRender: React.FC<{ props }> = ({ props }) => {
  return (
    <form {...props.formProps}>
      <span>
        <input
          {...props.inputProps}
          ref={props.inputRef}
          maxLength={16}
          className="rct-tree-item-renaming-input"
        />
      </span>
      <span>
        <button {...props.submitButtonProps} ref={props.submitButtonRef} type="submit" />
      </span>
    </form>
  );
};

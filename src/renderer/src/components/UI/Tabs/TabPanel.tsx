interface TabPanelProps {
  value: number;
  tabValue: number;
  children?: React.ReactNode;
  remount?: boolean;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  value,
  tabValue,
  children,
  remount,
  className,
}) => {
  if (remount) {
    return <>{value === tabValue && children}</>;
  }

  return (
    <div hidden={value !== tabValue} className={className}>
      {children}
    </div>
  );
};

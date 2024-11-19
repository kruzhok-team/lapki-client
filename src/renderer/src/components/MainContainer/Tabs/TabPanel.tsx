interface TabPanelProps {
  value: number;
  tabValue: number;
  children?: React.ReactNode;
  remount?: boolean;
}

export const TabPanel: React.FC<TabPanelProps> = ({ value, tabValue, children, remount }) => {
  if (remount) {
    return <>{value === tabValue && children}</>;
  }

  return <div hidden={value !== tabValue}>{children}</div>;
};

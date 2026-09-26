export const RIGHT_SIDEBAR_CLOSED_WIDTH = 5;
export const RIGHT_SIDEBAR_DEFAULT_WIDTH = 420;

export const getRightSidebarOffset = (isOpen: boolean, openWidth: number) =>
  isOpen ? openWidth : RIGHT_SIDEBAR_CLOSED_WIDTH;

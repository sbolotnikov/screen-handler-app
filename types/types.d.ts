export type ScreenSettingsContextType = {
  darkMode: boolean;
  changeTheme: (a: boolean) => void;
  hideNav: boolean;
  changeNav: (a: boolean) => void;
};

export type TablePage = {
  id: string;
  name: string;
  data: Record<string, unknown>; // Generic object type for table data
  settings: Record<string, unknown>; // Generic object type for table settings
};

import React from 'react';

interface SettingProps {
  onSwitchTheme: () => void;
}

export const Setting: React.FC<SettingProps> = ({ onSwitchTheme }) => {
  return (
    <section className="flex flex-col">
      <h3 className="mx-4 mb-3 border-b border-border-primary py-2 text-center text-lg">
        Настройки
      </h3>

      <div className="px-4">
        <label>
          <button className="btn-primary" onClick={onSwitchTheme}>
            Тема
          </button>
        </label>
      </div>
    </section>
  );
};

import React, { useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import { useSettings } from '@renderer/hooks';
import type { FileMenuItem } from '@renderer/hooks/useFileMenu';
import { useFlasherHooks } from '@renderer/hooks/useFlasherHooks';
import { useModal } from '@renderer/hooks/useModal';
import { useWindowManagerStore } from '@renderer/hooks/useWindowManagerStore';
import { useDoc } from '@renderer/store/useDoc';
import { useSimulatorWindow } from '@renderer/store/useSimulatorWindow';
import { useTasks } from '@renderer/store/useTasks';

import {
  AboutTheProgramModal,
  Autosave,
  CompilerSelectModal,
  DocSelectModal,
  FlasherSelectModal,
  FlasherSelectModalFormValues,
  History,
  ResetSettingsModal,
  Setting,
} from './components';

import { FileMenu } from '../FileMenu';
import { Flasher } from '../Modules/Flasher';
import { Simulator } from '../Simulator';
import { MovingModal } from '../UI/Modal/MovingModal';

import './style.css';

interface HeaderProps {
  fileMenuItems: FileMenuItem[];
  initialSimulationSmId?: string;
}

type HeaderMenu = 'files' | 'settings' | 'history' | null;

export const Header: React.FC<HeaderProps> = ({ fileMenuItems, initialSimulationSmId }) => {
  const rootRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<HeaderMenu>(null);
  const [simulatorStatus, setSimulatorStatus] = useState('Идет подключение...');
  const [isAutoSizedSimulator, setIsAutoSizedSimulator] = useState(false);
  const [isCompilerOpen, openCompilerSettings, closeCompilerSettings] = useModal(false);
  const [isAboutModalOpen, openAboutModal, closeAboutModal] = useModal(false);
  const [isResetSettingsOpen, openResetSettings, closeResetSettings] = useModal(false);
  const [isAutosaveOpen, openAutosaveSettings, closeAutosaveSettings] = useModal(false);
  const [isDocModalOpen, openDocModal, closeDocModal] = useModal(false);
  const [isSimulatorOpen, openSimulator, closeSimulator] = useSimulatorWindow((state) => [
    state.isOpen,
    state.open,
    state.close,
  ]);
  const submissionActive = useTasks((state) => state.submissionActive);
  const [setActiveWindow, bringToFront, removeWindow] = useWindowManagerStore((state) => [
    state.setActiveWindow,
    state.bringToFront,
    state.removeWindow,
  ]);
  const [flasherSetting, setFlasherSetting] = useSettings('flasher');
  const [isFlasherSettingsOpen, openFlasherSettings, closeFlasherSettings] = useModal(false);
  const [openDocumentation, openTasks, isDocOpen, visibleDocViews] = useDoc((state) => [
    state.onDocumentationToggle,
    state.onTasksToggle,
    state.isOpen,
    state.visibleViews,
  ]);
  useFlasherHooks();

  useEffect(() => {
    if (!isSimulatorOpen) return;
    setActiveWindow('simulator');
    bringToFront('simulator');
  }, [bringToFront, isSimulatorOpen, setActiveWindow]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closeFlasherModal = () => {
    Flasher.freezeReconnectTimer(false);
    closeFlasherSettings();
  };

  const openLoaderSettings = () => {
    Flasher.freezeReconnectTimer(true);
    openFlasherSettings();
  };

  const handleFlasherModalSubmit = (data: FlasherSelectModalFormValues) => {
    if (!flasherSetting) return;
    setFlasherSetting({ ...flasherSetting, ...data });
  };

  const toggleMenu = (menu: Exclude<HeaderMenu, null>) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  const openSimulatorWindow = () => {
    setOpenMenu(null);
    openSimulator();
    setActiveWindow('simulator');
    bringToFront('simulator');
  };

  const closeSimulatorWindow = () => {
    if (submissionActive) {
      toast.warning('Дождитесь завершения проверки решения');
      return;
    }
    closeSimulator();
    removeWindow('simulator');
  };

  return (
    <>
      <header
        ref={rootRef}
        className="relative z-[100] flex h-[25px] shrink-0 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
      >
        <div className="relative h-full">
          <button
            type="button"
            className="header-menu-button"
            aria-expanded={openMenu === 'files'}
            onClick={() => toggleMenu('files')}
          >
            Файл
          </button>
          <div className={`header-file-popover ${openMenu !== 'files' ? 'hidden' : ''}`}>
            <FileMenu
              items={fileMenuItems}
              variant="dropdown"
              onItemSelect={() => setOpenMenu(null)}
            />
          </div>
        </div>

        <div className="relative h-full">
          <button
            type="button"
            className="header-menu-button"
            aria-expanded={openMenu === 'settings'}
            onClick={() => toggleMenu('settings')}
          >
            Настройки
          </button>
          {openMenu === 'settings' && (
            <div className="header-settings-popover">
              <Setting
                openCompilerSettings={openCompilerSettings}
                openAboutModal={openAboutModal}
                openResetSettings={openResetSettings}
                openLoaderSettings={openLoaderSettings}
                openAutosaveSettings={openAutosaveSettings}
                openDocumentationSettings={openDocModal}
                onItemSelect={() => setOpenMenu(null)}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          className={`header-menu-button ${
            isDocOpen && visibleDocViews.documentation ? 'bg-bg-hover' : ''
          }`}
          aria-pressed={isDocOpen && visibleDocViews.documentation}
          onClick={openDocumentation}
        >
          Документация
        </button>

        <button
          type="button"
          className={`header-menu-button ${
            isDocOpen && visibleDocViews.tasks ? 'bg-bg-hover' : ''
          }`}
          aria-pressed={isDocOpen && visibleDocViews.tasks}
          onClick={openTasks}
        >
          Задачник
        </button>

        <button
          type="button"
          className={`header-menu-button ${isSimulatorOpen ? 'bg-bg-hover' : ''}`}
          aria-pressed={isSimulatorOpen}
          onClick={openSimulatorWindow}
        >
          Симулятор
        </button>

        <div className="relative h-full">
          <button
            type="button"
            className="header-menu-button"
            aria-expanded={openMenu === 'history'}
            disabled={submissionActive}
            onClick={() => toggleMenu('history')}
          >
            История изменений
          </button>
          {openMenu === 'history' && (
            <div className="header-popover w-[340px] rounded-lg">
              <History />
            </div>
          )}
        </div>
      </header>

      <MovingModal
        id="simulator"
        title={
          <div className="flex items-center gap-11">
            <span>Симулятор</span>
            <span className="font-normal">
              <span className="font-medium">Статус: </span>
              <span className="text-primary">{simulatorStatus}</span>
            </span>
          </div>
        }
        isOpen={isSimulatorOpen}
        position={{ x: 20, y: 18 }}
        onRequestClose={closeSimulatorWindow}
        hideCancelButton
        className={`max-h-[calc(100vh-36px)] max-w-[calc(100vw-40px)] p-6 [&>.content]:overflow-hidden ${
          isAutoSizedSimulator ? 'h-fit w-fit' : 'h-[664px] w-[976px]'
        }`}
      >
        <Simulator
          initialSmId={initialSimulationSmId}
          onStatusChange={setSimulatorStatus}
          onAutoSizeChange={setIsAutoSizedSimulator}
        />
      </MovingModal>

      <FlasherSelectModal
        isOpen={isFlasherSettingsOpen}
        onSubmit={handleFlasherModalSubmit}
        onClose={closeFlasherModal}
      />
      <CompilerSelectModal isOpen={isCompilerOpen} onClose={closeCompilerSettings} />
      <AboutTheProgramModal isOpen={isAboutModalOpen} onClose={closeAboutModal} />
      <ResetSettingsModal isOpen={isResetSettingsOpen} onClose={closeResetSettings} />
      <DocSelectModal isOpen={isDocModalOpen} onClose={closeDocModal} />
      <Autosave isOpen={isAutosaveOpen} onClose={closeAutosaveSettings} />
    </>
  );
};

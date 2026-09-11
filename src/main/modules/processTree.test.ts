import { EventEmitter } from 'events';

import { type ChildProcess, execFile } from 'child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('child_process', async () => {
  const actual = await vi.importActual<typeof import('child_process')>('child_process');
  const execFile = vi.fn();
  return { ...actual, default: { ...actual, execFile }, execFile };
});

import { terminateProcessTree } from './processTree';

const createChild = () => {
  const child = new EventEmitter() as ChildProcess;
  Object.assign(child, {
    pid: 42,
    exitCode: null,
    signalCode: null,
    kill: vi.fn(() => true),
  });
  return child;
};

const exitChild = (child: ChildProcess) => {
  Object.assign(child, { exitCode: 0 });
  child.emit('exit', 0, null);
};

describe('terminateProcessTree', () => {
  beforeEach(() => {
    vi.mocked(execFile).mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('terminates the complete Windows process tree gracefully when possible', async () => {
    const child = createChild();
    vi.mocked(execFile).mockImplementation(((_file, _args, _options, callback) => {
      exitChild(child);
      callback(null, '', '');
      return createChild();
    }) as typeof execFile);

    await terminateProcessTree(child, 'win32');

    expect(execFile).toHaveBeenCalledWith(
      'taskkill',
      ['/PID', '42', '/T'],
      expect.objectContaining({ windowsHide: true }),
      expect.any(Function)
    );
    expect(child.kill).not.toHaveBeenCalled();
  });

  it('forces the Windows process tree to exit when graceful termination fails', async () => {
    const child = createChild();
    vi.mocked(execFile)
      .mockImplementationOnce(((_file, _args, _options, callback) => {
        callback(new Error('requires force'), '', '');
        return createChild();
      }) as typeof execFile)
      .mockImplementationOnce(((_file, _args, _options, callback) => {
        exitChild(child);
        callback(null, '', '');
        return createChild();
      }) as typeof execFile);

    await terminateProcessTree(child, 'win32');

    expect(vi.mocked(execFile).mock.calls[1]?.[1]).toEqual(['/PID', '42', '/T', '/F']);
    expect(child.kill).not.toHaveBeenCalled();
  });

  it('falls back to killing the child when taskkill fails', async () => {
    const child = createChild();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(execFile).mockImplementation(((_file, _args, _options, callback) => {
      callback(new Error('taskkill unavailable'), '', '');
      return createChild();
    }) as typeof execFile);

    await terminateProcessTree(child, 'win32');

    expect(child.kill).toHaveBeenCalledWith('SIGKILL');
  });

  it('uses graceful termination for a POSIX child that exits promptly', async () => {
    const child = createChild();
    vi.mocked(child.kill).mockImplementation(() => {
      queueMicrotask(() => exitChild(child));
      return true;
    });

    await terminateProcessTree(child, 'linux', 20);

    expect(child.kill).toHaveBeenCalledOnce();
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
    expect(execFile).not.toHaveBeenCalled();
  });
});

import { type ChildProcess, execFile } from 'child_process';

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 2_000;

const hasExited = (child: ChildProcess): boolean =>
  child.exitCode !== null || child.signalCode !== null;

const waitForExit = (child: ChildProcess, timeoutMs: number): Promise<boolean> => {
  if (hasExited(child)) return Promise.resolve(true);
  if (timeoutMs <= 0) return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (exited: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.removeListener('exit', onExit);
      resolve(exited);
    };
    const onExit = () => finish(true);
    const timer = setTimeout(() => finish(hasExited(child)), timeoutMs);

    child.once('exit', onExit);
  });
};

const runTaskkill = (pid: number, force: boolean, timeoutMs: number): Promise<void> =>
  new Promise((resolve, reject) => {
    if (timeoutMs <= 0) {
      reject(new Error('Process shutdown timed out'));
      return;
    }

    const args = ['/PID', String(pid), '/T'];
    if (force) args.push('/F');

    execFile('taskkill', args, { timeout: timeoutMs, windowsHide: true }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

const remainingTime = (deadline: number): number => Math.max(0, deadline - Date.now());

const terminateWindowsProcessTree = async (
  child: ChildProcess,
  timeoutMs: number
): Promise<void> => {
  if (!child.pid || hasExited(child)) return;

  const deadline = Date.now() + timeoutMs;
  const gracefulTimeout = Math.max(1, Math.floor(timeoutMs / 2));

  try {
    await runTaskkill(child.pid, false, gracefulTimeout);
    if (await waitForExit(child, Math.min(250, remainingTime(deadline)))) return;
  } catch {
    // Console processes commonly require forced termination on Windows.
  }

  try {
    await runTaskkill(child.pid, true, remainingTime(deadline));
    await waitForExit(child, remainingTime(deadline));
  } catch (error) {
    console.warn(`Failed to terminate process tree ${child.pid} with taskkill:`, error);
    try {
      child.kill('SIGKILL');
    } catch (fallbackError) {
      console.warn(`Failed to terminate process ${child.pid} directly:`, fallbackError);
    }
  }
};

const terminatePosixProcess = async (child: ChildProcess, timeoutMs: number): Promise<void> => {
  if (hasExited(child)) return;

  child.kill('SIGTERM');
  if (await waitForExit(child, timeoutMs)) return;

  child.kill('SIGKILL');
};

export const terminateProcessTree = async (
  child: ChildProcess,
  platform: NodeJS.Platform = process.platform,
  timeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS
): Promise<void> => {
  if (platform === 'win32') {
    await terminateWindowsProcessTree(child, timeoutMs);
  } else {
    await terminatePosixProcess(child, timeoutMs);
  }
};

import Websocket from 'isomorphic-ws';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InterpreterClient } from './Interpreter';
import { ClientWS } from './Websocket/ClientWS';

class FirstClient extends ClientWS {}
class SecondClient extends ClientWS {}

describe('ClientWS message subscriptions', () => {
  it('isolates listeners between subclasses', () => {
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    const unsubscribeFirst = FirstClient.subscribeMessages(firstListener);
    const unsubscribeSecond = SecondClient.subscribeMessages(secondListener);
    const message = { data: 'first' } as Websocket.MessageEvent;

    FirstClient.messageHandler(message);

    expect(firstListener).toHaveBeenCalledWith(message);
    expect(secondListener).not.toHaveBeenCalled();
    unsubscribeFirst();
    unsubscribeSecond();
  });
});

describe('InterpreterClient', () => {
  afterEach(() => {
    InterpreterClient.connection = undefined;
    InterpreterClient.ready = false;
    InterpreterClient.activeRunId = undefined;
    InterpreterClient.activeKind = undefined;
  });

  it('uses the interpreter websocket endpoint', () => {
    expect(InterpreterClient.makeAddress('127.0.0.1', 49152)).toBe('ws://127.0.0.1:49152/ws');
  });

  it('keeps readiness when reconnecting to the active websocket', async () => {
    InterpreterClient.host = '127.0.0.1';
    InterpreterClient.port = 49152;
    InterpreterClient.connection = {
      readyState: Websocket.OPEN,
      OPEN: Websocket.OPEN,
      CONNECTING: Websocket.CONNECTING,
    } as unknown as Websocket;
    InterpreterClient.ready = true;
    InterpreterClient.bind(vi.fn(), vi.fn());

    await InterpreterClient.connect('127.0.0.1', 49152);

    expect(InterpreterClient.ready).toBe(true);
  });

  it('sends a correlated versioned start request only after readiness', () => {
    const send = vi.fn();
    InterpreterClient.connection = {
      readyState: Websocket.OPEN,
      send,
    } as unknown as Websocket;
    const payload = {
      xml: '<graphml/>',
      machineId: 'machine',
      mode: 'finite' as const,
      timeoutSeconds: 10,
      parameters: { message: 'hello' },
    };

    expect(InterpreterClient.start(payload)).toBeUndefined();
    InterpreterClient.ready = true;
    const runId = InterpreterClient.start(payload);

    expect(runId).toBeTruthy();
    const envelope = JSON.parse(send.mock.calls[0][0]);
    expect(envelope).toMatchObject({
      protocolVersion: 2,
      type: 'run.start',
      runId,
      payload,
    });
    expect(envelope.requestId).toBeTruthy();
    expect(InterpreterClient.activeRunId).toBe(runId);
  });

  it('releases the active run after a terminal response', () => {
    InterpreterClient.activeRunId = 'run-1';
    InterpreterClient.activeKind = 'run';

    InterpreterClient.messageHandler({
      data: JSON.stringify({
        protocolVersion: 2,
        type: 'run.cancelled',
        requestId: 'request-1',
        runId: 'run-1',
        payload: { status: 'cancelled' },
      }),
    } as Websocket.MessageEvent);

    expect(InterpreterClient.activeRunId).toBeUndefined();
    expect(InterpreterClient.activeKind).toBeUndefined();
  });

  it('starts a correlated test operation and allows cancellation', () => {
    const send = vi.fn();
    InterpreterClient.connection = {
      readyState: Websocket.OPEN,
      send,
    } as unknown as Websocket;
    InterpreterClient.ready = true;

    const runId = InterpreterClient.startTest({
      xml: '<graphml/>',
      machineId: 'machine',
      testId: 'first',
      task: {
        schemaVersion: 1,
        id: 'task',
        version: 1,
        title: 'Task',
        summary: 'Summary',
        description: 'Description',
        platformId: 'junior-reader',
        tests: [],
      },
    });

    if (!runId) throw new Error('Expected test run ID');
    expect(InterpreterClient.activeKind).toBe('test');
    expect(InterpreterClient.cancel(runId)).toBe(true);
    expect(JSON.parse(send.mock.calls[0][0]).type).toBe('test.start');
    expect(JSON.parse(send.mock.calls[1][0]).type).toBe('run.cancel');
  });

  it('does not send cancellation for a submission', () => {
    const send = vi.fn();
    InterpreterClient.connection = {
      readyState: Websocket.OPEN,
      send,
    } as unknown as Websocket;
    InterpreterClient.ready = true;
    const runId = InterpreterClient.startSubmission({
      xml: '<graphml/>',
      machineId: 'machine',
      task: {
        schemaVersion: 1,
        id: 'task',
        version: 1,
        title: 'Task',
        summary: 'Summary',
        description: 'Description',
        platformId: 'junior-reader',
        tests: [],
      },
    });

    if (!runId) throw new Error('Expected submission ID');
    expect(InterpreterClient.cancel(runId)).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
  });
});

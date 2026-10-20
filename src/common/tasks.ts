export const TASK_SCHEMA_VERSION = 1 as const;
export const DEFAULT_TEST_TIMEOUT_SECONDS = 10;
export const MAX_TASK_TESTS = 32;
export const MAX_TASK_TOTAL_TIMEOUT_SECONDS = 300;

export type TaskPlatformId = 'junior-gardener' | 'junior-reader';
export type GardenerCell = -1 | 0 | 1 | 2 | 3;
export type GardenerOrientation = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

export interface GardenerTaskInput {
  width: number;
  height: number;
  field: GardenerCell[][];
  position: { x: number; y: number };
  orientation: GardenerOrientation;
}

export interface ReaderTaskInput {
  message: string;
}

export type GardenerFieldCheck = {
  type: 'gardener.field.equals';
  expected: GardenerCell[][];
};

export type GardenerPositionCheck = {
  type: 'gardener.position.equals';
  expected: { x: number; y: number };
};

export type ReaderImpulsesCheck = {
  type: 'reader.impulses.equals';
  expected: Array<'impulseA' | 'impulseB' | 'impulseC'>;
};

export type VerificationCheck = GardenerFieldCheck | GardenerPositionCheck | ReaderImpulsesCheck;

export interface VerificationTest {
  id: string;
  title: string;
  timeoutSeconds?: number;
  input: GardenerTaskInput | ReaderTaskInput;
  checks: VerificationCheck[];
  hiddenCells?: boolean[][];
}

export interface ProgrammingTask {
  schemaVersion: typeof TASK_SCHEMA_VERSION;
  id: string;
  version: number;
  title: string;
  summary: string;
  description: string;
  codeWord?: string;
  platformId: TaskPlatformId;
  tests: VerificationTest[];
}

export interface CatalogTask extends ProgrammingTask {
  assetBaseUrl: string;
}

export interface TaskDiagnostic {
  file: string;
  message: string;
}

export interface TaskCatalog {
  tasks: CatalogTask[];
  diagnostics: TaskDiagnostic[];
  assetRootUrl: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const assertObject = (value: unknown, path: string): Record<string, unknown> => {
  if (!isObject(value)) throw new Error(`${path} должно быть объектом`);
  return value;
};

const assertExactKeys = (
  value: Record<string, unknown>,
  required: string[],
  optional: string[],
  path: string
) => {
  for (const key of required) {
    if (!(key in value)) throw new Error(`${path}.${key} обязательно`);
  }
  const allowed = new Set([...required, ...optional]);
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown) throw new Error(`${path}.${unknown} не поддерживается schemaVersion 1`);
};

const assertString = (value: unknown, path: string, maxLength: number): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${path} должно быть непустой строкой`);
  }
  if (value.length > maxLength) throw new Error(`${path} превышает ${maxLength} символов`);
  return value;
};

const assertInteger = (value: unknown, path: string, min: number, max: number): number => {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new Error(`${path} должно быть целым числом от ${min} до ${max}`);
  }
  return value as number;
};

const assertPosition = (value: unknown, path: string, width: number, height: number) => {
  const position = assertObject(value, path);
  assertExactKeys(position, ['x', 'y'], [], path);
  return {
    x: assertInteger(position.x, `${path}.x`, 0, width - 1),
    y: assertInteger(position.y, `${path}.y`, 0, height - 1),
  };
};

const assertField = (
  value: unknown,
  path: string,
  width: number,
  height: number
): GardenerCell[][] => {
  if (!Array.isArray(value) || value.length !== height) {
    throw new Error(`${path} должно содержать ${height} строк`);
  }
  return value.map((row, y) => {
    if (!Array.isArray(row) || row.length !== width) {
      throw new Error(`${path}[${y}] должно содержать ${width} клеток`);
    }
    return row.map((cell, x) => {
      if (![-1, 0, 1, 2, 3].includes(cell as number)) {
        throw new Error(`${path}[${y}][${x}] содержит неизвестный тип клетки`);
      }
      return cell as GardenerCell;
    });
  });
};

const assertHiddenCells = (
  value: unknown,
  path: string,
  width: number,
  height: number,
  position: { x: number; y: number }
): boolean[][] => {
  if (!Array.isArray(value) || value.length !== height) {
    throw new Error(`${path} должно содержать ${height} строк`);
  }
  const hiddenCells = value.map((row, y) => {
    if (!Array.isArray(row) || row.length !== width) {
      throw new Error(`${path}[${y}] должно содержать ${width} клеток`);
    }
    return row.map((hidden, x) => {
      if (typeof hidden !== 'boolean') {
        throw new Error(`${path}[${y}][${x}] должно быть логическим значением`);
      }
      return hidden;
    });
  });
  if (hiddenCells[position.y][position.x]) {
    throw new Error(`${path} не может скрывать стартовую клетку`);
  }
  return hiddenCells;
};

const parseGardenerTest = (
  rawInput: unknown,
  rawChecks: unknown[],
  path: string
): Pick<VerificationTest, 'input' | 'checks'> => {
  const input = assertObject(rawInput, `${path}.input`);
  assertExactKeys(
    input,
    ['width', 'height', 'field', 'position', 'orientation'],
    [],
    `${path}.input`
  );
  const width = assertInteger(input.width, `${path}.input.width`, 1, 30);
  const height = assertInteger(input.height, `${path}.input.height`, 1, 30);
  const orientation = input.orientation;
  if (!['NORTH', 'EAST', 'SOUTH', 'WEST'].includes(orientation as string)) {
    throw new Error(`${path}.input.orientation содержит неизвестное направление`);
  }

  const checks = rawChecks.map((rawCheck, index): VerificationCheck => {
    const checkPath = `${path}.checks[${index}]`;
    const check = assertObject(rawCheck, checkPath);
    assertExactKeys(check, ['type', 'expected'], [], checkPath);
    if (check.type === 'gardener.field.equals') {
      return {
        type: check.type,
        expected: assertField(check.expected, `${checkPath}.expected`, width, height),
      };
    }
    if (check.type === 'gardener.position.equals') {
      return {
        type: check.type,
        expected: assertPosition(check.expected, `${checkPath}.expected`, width, height),
      };
    }
    throw new Error(`${checkPath}.type не поддерживается платформой junior-gardener`);
  });

  const field = assertField(input.field, `${path}.input.field`, width, height);
  const position = assertPosition(input.position, `${path}.input.position`, width, height);
  if (field[position.y][position.x] === -1) {
    throw new Error(`${path}.input.position не может быть стеной`);
  }
  return {
    input: { width, height, field, position, orientation: orientation as GardenerOrientation },
    checks,
  };
};

const parseReaderTest = (
  rawInput: unknown,
  rawChecks: unknown[],
  path: string
): Pick<VerificationTest, 'input' | 'checks'> => {
  const input = assertObject(rawInput, `${path}.input`);
  assertExactKeys(input, ['message'], [], `${path}.input`);
  if (typeof input.message !== 'string' || Array.from(input.message).length > 10_000) {
    throw new Error(`${path}.input.message должно содержать не более 10000 символов`);
  }
  const checks = rawChecks.map((rawCheck, index): VerificationCheck => {
    const checkPath = `${path}.checks[${index}]`;
    const check = assertObject(rawCheck, checkPath);
    assertExactKeys(check, ['type', 'expected'], [], checkPath);
    if (check.type !== 'reader.impulses.equals') {
      throw new Error(`${checkPath}.type не поддерживается платформой junior-reader`);
    }
    if (
      !Array.isArray(check.expected) ||
      check.expected.some((signal) => !['impulseA', 'impulseB', 'impulseC'].includes(signal))
    ) {
      throw new Error(`${checkPath}.expected содержит неизвестный импульс`);
    }
    return { type: check.type, expected: [...check.expected] } as ReaderImpulsesCheck;
  });
  return { input: { message: input.message }, checks };
};

export const parseProgrammingTask = (value: unknown): ProgrammingTask => {
  const task = assertObject(value, 'task');
  assertExactKeys(
    task,
    ['schemaVersion', 'id', 'version', 'title', 'summary', 'description', 'platformId', 'tests'],
    ['codeWord'],
    'task'
  );
  if (task.schemaVersion !== TASK_SCHEMA_VERSION) {
    throw new Error(`schemaVersion ${String(task.schemaVersion)} не поддерживается`);
  }
  if (!['junior-gardener', 'junior-reader'].includes(task.platformId as string)) {
    throw new Error('task.platformId не поддерживается задачником');
  }
  if (!Array.isArray(task.tests) || task.tests.length === 0) {
    throw new Error('task.tests должен быть непустым массивом');
  }
  if (task.tests.length > MAX_TASK_TESTS) {
    throw new Error(`task.tests содержит больше ${MAX_TASK_TESTS} тестов`);
  }

  const platformId = task.platformId as TaskPlatformId;
  const testIds = new Set<string>();
  let totalTimeout = 0;
  const tests = task.tests.map((rawTest, index): VerificationTest => {
    const path = `task.tests[${index}]`;
    const test = assertObject(rawTest, path);
    assertExactKeys(
      test,
      ['id', 'title', 'input', 'checks'],
      ['timeoutSeconds', 'hiddenCells'],
      path
    );
    const id = assertString(test.id, `${path}.id`, 128);
    if (testIds.has(id)) throw new Error(`${path}.id повторяет идентификатор ${id}`);
    testIds.add(id);
    if (!Array.isArray(test.checks) || test.checks.length === 0) {
      throw new Error(`${path}.checks должен быть непустым массивом`);
    }
    const timeoutSeconds =
      test.timeoutSeconds === undefined
        ? undefined
        : assertInteger(test.timeoutSeconds, `${path}.timeoutSeconds`, 1, 30);
    totalTimeout += timeoutSeconds ?? DEFAULT_TEST_TIMEOUT_SECONDS;
    const parsed =
      platformId === 'junior-gardener'
        ? parseGardenerTest(test.input, test.checks, path)
        : parseReaderTest(test.input, test.checks, path);
    if (platformId === 'junior-reader' && test.hiddenCells !== undefined) {
      throw new Error(`${path}.hiddenCells не поддерживается платформой junior-reader`);
    }
    const hiddenCells =
      test.hiddenCells === undefined
        ? undefined
        : assertHiddenCells(
            test.hiddenCells,
            `${path}.hiddenCells`,
            (parsed.input as GardenerTaskInput).width,
            (parsed.input as GardenerTaskInput).height,
            (parsed.input as GardenerTaskInput).position
          );
    return {
      id,
      title: assertString(test.title, `${path}.title`, 200),
      ...(timeoutSeconds === undefined ? {} : { timeoutSeconds }),
      ...parsed,
      ...(hiddenCells === undefined ? {} : { hiddenCells }),
    };
  });
  if (totalTimeout > MAX_TASK_TOTAL_TIMEOUT_SECONDS) {
    throw new Error(`суммарный timeout тестов превышает ${MAX_TASK_TOTAL_TIMEOUT_SECONDS} секунд`);
  }

  return {
    schemaVersion: TASK_SCHEMA_VERSION,
    id: assertString(task.id, 'task.id', 128),
    version: assertInteger(task.version, 'task.version', 1, Number.MAX_SAFE_INTEGER),
    title: assertString(task.title, 'task.title', 200),
    summary: assertString(task.summary, 'task.summary', 1000),
    description: assertString(task.description, 'task.description', 100_000),
    ...(task.codeWord === undefined
      ? {}
      : { codeWord: assertString(task.codeWord, 'task.codeWord', 100) }),
    platformId,
    tests,
  };
};

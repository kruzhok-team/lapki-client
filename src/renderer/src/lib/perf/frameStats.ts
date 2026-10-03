/**
 * Журнал длительностей отрисовки кадров холста. Пишет CanvasEditor на каждый кадр,
 * читают FPS-оверлей и window.__perf (см. devtools.ts). Запись - одна вставка
 * в кольцевой буфер, так что держать включённым всегда можно.
 */
const CAPACITY = 1024;

const at = new Float64Array(CAPACITY);
const duration = new Float64Array(CAPACITY);
let count = 0;

export const frameStats = {
  recordDraw(start: number, end: number) {
    const index = count % CAPACITY;
    at[index] = end;
    duration[index] = end - start;
    count++;
  },

  /** Длительности отрисовок, завершившихся после момента since (performance.now()) */
  drawsSince(since: number) {
    const result: number[] = [];
    const first = Math.max(0, count - CAPACITY);
    for (let i = first; i < count; i++) {
      const index = i % CAPACITY;
      if (at[index] >= since) result.push(duration[index]);
    }
    return result;
  },
};

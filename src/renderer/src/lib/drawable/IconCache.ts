const MIN_SIZE = 4;
const MAX_SIZE = 256;
/** Лимит памяти растров; при превышении выкидываются давно не нужные */
const MAX_BYTES = 8 * 1024 * 1024;

/** Размеры растров по длинной стороне: 4, 6, 8, 11, 16 ... 256, шаг √2 */
const SIZES: number[] = [];
for (let size = MIN_SIZE; Math.round(size) <= MAX_SIZE; size *= Math.SQRT2) {
  if (SIZES[SIZES.length - 1] !== Math.round(size)) SIZES.push(Math.round(size));
}

type Raster = {
  bitmap: ImageBitmap;
  bytes: number;
  /** Номер кадра, в котором растр последний раз был нужен */
  used: number;
};

/**
 * Кеш растров иконок по размеру на экране.
 *
 * ctx.drawImage(SVG) в Chromium растеризует SVG заново на каждом вызове. Когда видна
 * вся схема, иконок на экране сотни, и это большая часть кадра. Здесь SVG растеризуется
 * один раз на картинку и размер из SIZES: берётся ближайший размер не меньше нужного,
 * поэтому растр при отрисовке уменьшается не больше чем в √2 раз и не теряет чёткость.
 * Растр делается при первой отрисовке и хранится в ImageBitmap: drawImage(ImageBitmap)
 * примерно вдвое дешевле drawImage(canvas). Иконки крупнее MAX_SIZE рисуются SVG напрямую.
 */
export class IconCache {
  private rasters = new Map<HTMLImageElement, (Raster | undefined)[]>();
  private bytes = 0;
  private frame = 0;
  private frameScheduled = false;

  /** Нарисовать иконку. Аргументы как у ctx.drawImage(img, x, y, width, height) */
  draw(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const size = Math.max(width, height);
    if (size > MAX_SIZE || !img.naturalWidth) {
      ctx.drawImage(img, x, y, width, height);
      return;
    }
    this.markFrame();
    const bitmap = this.getRaster(img, size);
    // Растр в дробной позиции заметно мягче SVG, поэтому края по целым пикселям;
    // сдвиг не больше 0.5 px на глаз не виден
    const left = Math.round(x);
    const top = Math.round(y);
    ctx.drawImage(
      bitmap,
      left,
      top,
      Math.max(1, Math.round(x + width) - left),
      Math.max(1, Math.round(y + height) - top)
    );
  }

  private getRaster(img: HTMLImageElement, size: number) {
    let index = SIZES.findIndex((bucket) => bucket >= size);
    if (index === -1) index = SIZES.length - 1;

    let list = this.rasters.get(img);
    if (!list) {
      list = [];
      this.rasters.set(img, list);
    }
    let raster = list[index];
    if (!raster) {
      raster = this.rasterize(img, SIZES[index]);
      list[index] = raster;
      this.bytes += raster.bytes;
      if (this.bytes > MAX_BYTES) this.evict();
    }
    raster.used = this.frame;
    return raster.bitmap;
  }

  /** SVG в растр: длинная сторона равна size, пропорции как у картинки */
  private rasterize(img: HTMLImageElement, size: number): Raster {
    const long = Math.max(img.naturalWidth, img.naturalHeight);
    const width = Math.max(1, Math.round((size * img.naturalWidth) / long));
    const height = Math.max(1, Math.round((size * img.naturalHeight) / long));
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
    return { bitmap: canvas.transferToImageBitmap(), bytes: width * height * 4, used: this.frame };
  }

  /** Выкинуть растры, которые дольше всех не были нужны, до 3/4 лимита */
  private evict() {
    const all: { list: (Raster | undefined)[]; index: number; raster: Raster }[] = [];
    for (const list of this.rasters.values()) {
      list.forEach((raster, index) => raster && all.push({ list, index, raster }));
    }
    all.sort((a, b) => a.raster.used - b.raster.used);
    for (const { list, index, raster } of all) {
      // Растры текущего кадра не трогаем, даже если лимит превышен
      if (this.bytes <= MAX_BYTES * 0.75 || raster.used === this.frame) break;
      list[index] = undefined;
      this.bytes -= raster.bytes;
      raster.bitmap.close();
    }
  }

  /** Всё, что нарисовано в одном таске, считается одним кадром */
  private markFrame() {
    if (this.frameScheduled) return;
    this.frameScheduled = true;
    queueMicrotask(() => {
      this.frameScheduled = false;
      this.frame++;
    });
  }
}

export const iconCache = new IconCache();

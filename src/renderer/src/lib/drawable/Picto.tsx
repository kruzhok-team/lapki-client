import { twMerge } from 'tailwind-merge';

import InitialIcon from '@renderer/assets/icons/initial state.svg';
import EdgeHandle from '@renderer/assets/icons/new transition.svg';
import Pen from '@renderer/assets/icons/pen.svg';
import UnknownIcon from '@renderer/assets/icons/unknown-alt.svg';
import { Rectangle } from '@renderer/lib/types/graphics';
import theme from '@renderer/theme';

import { drawImageFit, preloadImagesMap } from '../utils';
import { drawText, getTextWidth } from '../utils/text';

export type MarkedIconData = {
  icon: string;
  label?: string;
  color?: string;
};

let imagesLoaded = false;

export const icons: Map<string, HTMLImageElement> = new Map();
// TODO? export const iconsPaths: Map<string, string> = new Map();

export const imgBaseDir = './img/';

export function resolveImg(p: string): string {
  // FIXME: только относительные пути в папке img
  return imgBaseDir + p;
}

type BasePictoKey =
  | 'EdgeHandle'
  | 'InitialIcon'
  | 'unknown'
  | 'pen'
  | 'system'
  | 'variable'
  | 'op/notEquals'
  | 'op/equals'
  | 'op/less'
  | 'op/greater'
  | 'op/greaterOrEqual'
  | 'op/lessOrEqual'
  | 'onEnter'
  | 'onEnterAlt'
  | 'onExit'
  | 'onExitAlt'
  | 'stateMachine'
  | 'condition'
  | 'stubComponent'
  | 'stubEvent'
  | 'stubAction';

type BasePicto = {
  [key in BasePictoKey]: string;
};

const basePicto: BasePicto = {
  EdgeHandle: EdgeHandle,
  InitialIcon: InitialIcon,
  unknown: UnknownIcon,
  pen: Pen,
  system: resolveImg('common/system.svg'),
  variable: resolveImg('common/variable.svg'),
  stubComponent: resolveImg('common/stubComponent.svg'),
  stubEvent: resolveImg('common/stubEvent.svg'),
  stubAction: resolveImg('common/stubAction.svg'),
  condition: resolveImg('common/condition.svg'),

  'op/notEquals': resolveImg('bearloga/compare_not_equal.svg'),
  'op/equals': resolveImg('bearloga/compare_equal.svg'),
  'op/greater': resolveImg('bearloga/compare_more.svg'),
  'op/less': resolveImg('bearloga/compare_less.svg'),
  'op/greaterOrEqual': resolveImg('bearloga/compare_more_eq.svg'),
  'op/lessOrEqual': resolveImg('bearloga/compare_less_eq.svg'),
  // "op/or": resolveImg('common/compare_or.svg'),
  // "op/and": resolveImg('common/compare_and.svg'),

  onEnter: resolveImg('common/onEnterAlt.svg'),
  onExit: resolveImg('common/onExitAlt.svg'),
  onEnterAlt: resolveImg('common/onEnter.svg'),
  onExitAlt: resolveImg('common/onExit.svg'),
  stateMachine: resolveImg('common/statemachine.svg'),
};

export function extendPreloadPicto(addition: { [path: string]: string }) {
  for (const key in addition) {
    basePicto[key] = addition[key];
  }
}

/**
 * Загрузка графических ресурсов для пиктограмм
 *
 * @param callback Функция, выполняемая по загрузке всех иконок
 */
export function preloadPicto(callback: () => void) {
  if (imagesLoaded) {
    callback();
    return;
  }
  preloadImagesMap(icons, basePicto).then(() => {
    imagesLoaded = true;
    callback();
  });
}

export type PictoProps = {
  leftIcon?: string | MarkedIconData;
  rightIcon: string;
  bgColor?: string;
  fgColor?: string;
  opacity?: number;
  parameter?: string;
  // TODO: args
};

/**
 * Отрисовщик пиктограмм.
 * Выполняет отрисовку пиктограмм с учётом масштаба.
 */
export class Picto {
  scale = 1;

  isResourcesReady() {
    return imagesLoaded;
  }

  /**
   * Рисует масштабированный значок на canvas.
   *
   * @param ctx Контекст canvas, в котором рисуем
   * @param iconData Название значка или контейнер с данными для метки
   * @param bounds Координаты и размер рамки
   * @param fontSize Размер шрифта метки, по умолчанию равен 13
   */
  drawImage(
    ctx: CanvasRenderingContext2D,
    iconData: string | MarkedIconData,
    bounds: Rectangle,
    fontSize: number = 13
  ) {
    // console.log([iconName, icons.has(iconName)]);
    const isMarked = typeof iconData !== 'string';
    const iconName = isMarked ? iconData.icon : iconData;
    const image = icons.get(iconName);
    if (!image) return;

    // Отрисовка самой иконки
    ctx.beginPath();
    drawImageFit(ctx, image, {
      ...bounds,
      width: bounds.width / this.scale,
      height: bounds.height / this.scale,
    });
    ctx.closePath();

    if (isMarked && iconData['label']) {
      const { x, y, width, height } = bounds;
      // Координаты правого нижнего угла картинки
      const tX = x + (width + 6) / this.scale;
      const tY = y + (height + 3) / this.scale;
      // Отступы внутри метки
      const pX = 1 / this.scale;
      const pY = 0.5 / this.scale;
      const font = `500 ${fontSize / this.scale}px/0 Fira Mono`;
      const textWidth = getTextWidth(iconData.label, font);
      const textHeight = fontSize / this.scale;
      const labelWidth = textWidth + pX * 2 + 3;
      const labelHeight = textHeight + pY * 2 + 3;

      // Отрисовка заднего фона метки
      // Рисуется в правом нижнем углу картинки, ширина и высота зависит от текста
      ctx.beginPath();
      const prevFillStyle = ctx.fillStyle;
      ctx.fillStyle = theme.colors.diagram.state.bodyBg;
      ctx.roundRect(tX - labelWidth, tY - labelHeight, labelWidth, labelHeight, 2 / this.scale);
      ctx.fill();

      ctx.fillStyle = prevFillStyle;
      ctx.closePath();

      // Отрисовка текста метки
      ctx.beginPath();
      drawText(ctx, iconData.label, {
        x: tX - textWidth / 2 - pX,
        y: tY - textHeight - pY,
        font: {
          fontFamily: 'Fira Mono',
          fontSize: fontSize / this.scale,
          lineHeight: 1,
          fontWeight: 500,
        },
        textAlign: 'center',
        color: iconData.color ?? '#FFFFFF',
      });
      ctx.closePath();
    }
  }

  /**
   * Генерирует иконку для значка с меткой.
   * По сути, дублирует {@link drawImage} вне canvas.
   *
   * @param data Контейнер с данными значка
   * @param className Атрибут class для генерируемой ноды (дополнительно)
   * @returns JSX-нода со значком
   */
  getMarkedIcon(data: MarkedIconData, className?: string) {
    const icon = icons.get(data.icon);
    return (
      <div className={twMerge('relative size-8 shrink-0', className)}>
        <img className="h-full w-full object-contain" src={icon?.src ?? UnknownIcon} />
        {data.label && (
          <p
            className="absolute bottom-[-3px] right-[-6px] rounded-[2px] px-[1px] py-[0.5px] text-center font-Fira-Mono text-[13px] font-medium leading-[14px]"
            style={{
              color: data.color ?? '#FFFFFF',
              backgroundColor: theme.colors.diagram.state.bodyBg,
            }}
          >
            {data.label}
          </p>
        )}
      </div>
    );
  }

  eventWidth = 100;
  eventHeight = 40;
  eventMargin = 5;
  iconSize = 30;
  separatorVOffset = 4;
  iconVOffset = 5;
  iconHOffset = 10;
  pxPerChar = 15;
  textPadding = 5;

  drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    bgColor?: string,
    fgColor?: string,
    opacity?: number
  ) {
    ctx.save();
    ctx.fillStyle = bgColor ?? '#3a426b';
    ctx.strokeStyle = fgColor ?? '#fff';
    ctx.globalAlpha = opacity ?? 1.0;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width / this.scale, height / this.scale, 5 / this.scale);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  getBasePicto(iconId: BasePictoKey): string {
    return basePicto[iconId];
  }

  drawBorder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bgColor?: string,
    fgColor?: string,
    opacity?: number
  ) {
    this.drawRect(ctx, x, y, this.eventWidth, this.eventHeight, bgColor, fgColor, opacity);
  }

  drawCursor(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // FIXME: рисовать лучше под иконкой, рисует фон, даже если не просишь
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = 'none';
    ctx.lineWidth = 3 / this.scale;
    ctx.beginPath();
    ctx.roundRect(x, y, this.eventWidth / this.scale, this.eventHeight / this.scale, 5);
    ctx.stroke();
    ctx.restore();
  }

  drawMono(ctx: CanvasRenderingContext2D, x: number, y: number, ps: PictoProps) {
    const rightIcon = ps.rightIcon;
    const bgColor = ps.bgColor ?? '#3a426b';
    const fgColor = ps.fgColor ?? '#fff';
    const opacity = ps.opacity ?? 1.0;

    // Рамка
    this.drawRect(ctx, x, y, this.eventHeight, this.eventHeight, bgColor, fgColor, opacity);

    if (!rightIcon) return;

    this.drawImage(ctx, rightIcon, {
      x: x + (this.eventHeight - this.iconSize) / 2 / this.scale,
      y: y + this.iconVOffset / this.scale,
      width: this.iconSize,
      height: this.iconSize,
    });
  }

  drawText(ctx: CanvasRenderingContext2D, x: number, y: number, ps: PictoProps) {
    const text = ps.rightIcon;
    const bgColor = ps.bgColor ?? '#3a426b';
    const fgColor = ps.fgColor ?? '#fff';
    const opacity = ps.opacity ?? 1.0;

    const baseFontSize = 24;
    const w = this.textPadding * 2 + text.length * this.pxPerChar;
    const cy = (picto.eventHeight - baseFontSize) / this.scale;

    // Рамка
    this.drawRect(ctx, x, y, w, this.eventHeight, bgColor, fgColor, opacity);

    const fontSize = baseFontSize / picto.scale;
    ctx.save();
    ctx.font = `${fontSize}px/0 monospace`;
    ctx.fillStyle = fgColor;
    ctx.strokeStyle = fgColor;
    ctx.textBaseline = 'hanging';

    const p = 5 / picto.scale;
    ctx.fillText(text, x + p, y + cy - p);

    ctx.restore();
  }

  /**
   * Рисует масштабированную пиктограмму на canvas.
   * Главная функция в этом классе.
   *
   * @param ctx Контекст canvas, в котором рисуем
   * @param x X-координата
   * @param y Y-координата
   * @param ps Контейнер с параметрами пиктограммы
   */
  drawPicto(ctx: CanvasRenderingContext2D, x: number, y: number, ps: PictoProps) {
    const leftIcon = ps.leftIcon;
    const rightIcon = ps.rightIcon;
    const bgColor = ps.bgColor ?? '#3a426b';
    const fgColor = ps.fgColor ?? '#fff';
    const opacity = ps.opacity ?? 1.0;

    // Рамка
    this.drawBorder(ctx, x, y, bgColor, fgColor, opacity);

    if (!rightIcon) return;
    if (!leftIcon) {
      // single icon mode
      this.drawImage(ctx, rightIcon, {
        x: x + (this.eventWidth - this.iconSize) / 2 / this.scale,
        y: y + this.iconVOffset / this.scale,
        width: this.iconSize,
        height: this.iconSize,
      });
    } else {
      // double icon mode
      this.drawImage(ctx, leftIcon, {
        x: x + this.iconHOffset / this.scale,
        y: y + this.iconVOffset / this.scale,
        width: this.iconSize,
        height: this.iconSize,
      });

      ctx.strokeStyle = fgColor;
      ctx.lineWidth = 1;
      ctx.moveTo(x + this.eventWidth / 2 / this.scale, y + this.separatorVOffset / this.scale);
      ctx.lineTo(
        x + this.eventWidth / 2 / this.scale,
        y + (this.eventHeight - this.separatorVOffset) / this.scale
      );
      ctx.stroke();

      this.drawImage(ctx, rightIcon, {
        x: x + (this.eventWidth - this.iconSize - this.iconHOffset) / this.scale,
        y: y + this.iconVOffset / this.scale,
        width: this.iconSize,
        height: this.iconSize,
      });
    }
    if (ps.parameter) {
      const baseFontSize = 12;
      const cy = (picto.eventHeight - baseFontSize) / this.scale;
      const cx = (this.eventWidth - 5) / this.scale;
      const fontSize = baseFontSize / picto.scale;
      ctx.save();
      ctx.font = `${fontSize}px/0 monospace`;
      ctx.fillStyle = fgColor;
      ctx.strokeStyle = bgColor;
      ctx.textBaseline = 'hanging';
      ctx.textAlign = 'end';
      ctx.lineWidth = 0.5 / this.scale;

      ctx.strokeText(ps.parameter, x + cx, y + cy);
      ctx.fillText(ps.parameter, x + cx, y + cy);

      ctx.restore();
    }
  }
}

/**
 * Глобальный экземпляр отрисовщика пиктограмм.
 */
export const picto = new Picto();

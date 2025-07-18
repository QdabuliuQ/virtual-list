import raf from 'rc-util/lib/raf';
import * as React from 'react';

function smoothScrollOffset(offset: number) {
  return Math.floor(offset ** 0.5);
}

export function getPageXY(
  e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  horizontal: boolean,
) {
  const obj = 'touches' in e ? e.touches[0] : e;
  return obj[horizontal ? 'pageX' : 'pageY'] - window[horizontal ? 'scrollX' : 'scrollY'];
}

export default function useScrollDrag(
  inVirtual: boolean,
  componentRef: React.RefObject<HTMLElement>,
  onScrollOffset: (offset: number) => void,
) {
  React.useEffect(() => {
    const ele = componentRef.current;
    if (inVirtual && ele) {
      let mouseDownLock = false;
      let rafId: number;
      let offset: number;

      const stopScroll = () => {
        raf.cancel(rafId);
      };

      const continueScroll = () => {
        stopScroll();

        rafId = raf(() => {
          onScrollOffset(offset);
          continueScroll();
        });
      };

      // 清理拖拽状态的统一函数
      const clearDragState = () => {
        mouseDownLock = false;
        stopScroll();
      };

      const onMouseDown = (e: MouseEvent) => {
        // Skip if element set draggable
        if ((e.target as HTMLElement).draggable || e.button !== 0) {
          return;
        }
        // Skip if nest List has handled this event
        const event = e as MouseEvent & {
          _virtualHandled?: boolean;
        };
        if (!event._virtualHandled) {
          event._virtualHandled = true;
          mouseDownLock = true;
        }
      };

      const onMouseUp = () => {
        clearDragState();
      };
      
      const onDragStart = () => {
        clearDragState();
      };

      const onMouseMove = (e: MouseEvent) => {
        if (mouseDownLock) {
          const mouseY = getPageXY(e, false);
          const { top, bottom } = ele.getBoundingClientRect();

          if (mouseY <= top) {
            const diff = top - mouseY;
            offset = -smoothScrollOffset(diff);
            continueScroll();
          } else if (mouseY >= bottom) {
            const diff = mouseY - bottom;
            offset = smoothScrollOffset(diff);
            continueScroll();
          } else {
            stopScroll();
          }
        }
      };

      ele.addEventListener('mousedown', onMouseDown);
      ele.ownerDocument.addEventListener('mouseup', onMouseUp);
      ele.ownerDocument.addEventListener('mousemove', onMouseMove);
      
      ele.ownerDocument.addEventListener('dragstart', onDragStart);
      ele.ownerDocument.addEventListener('dragend', clearDragState);

      return () => {
        ele.removeEventListener('mousedown', onMouseDown);
        ele.ownerDocument.removeEventListener('mouseup', onMouseUp);
        ele.ownerDocument.removeEventListener('mousemove', onMouseMove);
        ele.ownerDocument.removeEventListener('dragstart', onDragStart);
        ele.ownerDocument.removeEventListener('dragend', clearDragState);
        stopScroll();
      };
    }
  }, [inVirtual]);
}

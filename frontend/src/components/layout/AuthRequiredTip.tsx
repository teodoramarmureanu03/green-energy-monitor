import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { AUTH_REQUIRED_MESSAGE } from "@/lib/auth-gate";

interface AuthRequiredTipProps {
  visible: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  placement?: "right" | "below";
}

const VIEWPORT_PAD = 12;
const TIP_MAX_WIDTH = 300;

/** Large notice anchored next to the control that triggered it. */
export function AuthRequiredTip({
  visible,
  anchorRef,
  placement = "below",
}: AuthRequiredTipProps) {
  const tipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    mode: "right" | "below";
  } | null>(null);

  useLayoutEffect(() => {
    if (!visible || !anchorRef.current) {
      setCoords(null);
      return;
    }

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const tipWidth = Math.min(
        tipRef.current?.offsetWidth || TIP_MAX_WIDTH,
        TIP_MAX_WIDTH,
        window.innerWidth - VIEWPORT_PAD * 2
      );

      if (placement === "right") {
        const left = rect.right + 12;
        // Flip below when there isn't room on the right.
        if (left + tipWidth > window.innerWidth - VIEWPORT_PAD) {
          setCoords({
            mode: "below",
            top: rect.bottom + 10,
            left: clampLeft(rect.left, tipWidth, rect.right),
          });
          return;
        }

        setCoords({
          mode: "right",
          top: rect.top + rect.height / 2,
          left,
        });
        return;
      }

      setCoords({
        mode: "below",
        top: rect.bottom + 10,
        left: clampLeft(rect.left, tipWidth, rect.right),
      });
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [visible, anchorRef, placement]);

  if (!visible || !coords) {
    return null;
  }

  return createPortal(
    <div
      ref={tipRef}
      className={`auth-required-tip auth-required-tip-${coords.mode}`}
      role="alert"
      style={
        coords.mode === "right"
          ? {
              top: coords.top,
              left: coords.left,
              transform: "translateY(-50%)",
            }
          : {
              top: coords.top,
              left: coords.left,
            }
      }
    >
      {AUTH_REQUIRED_MESSAGE}
    </div>,
    document.body
  );
}

/** Keep the tip fully inside the viewport; prefer aligning under the control. */
function clampLeft(
  preferredLeft: number,
  tipWidth: number,
  anchorRight: number
) {
  const maxLeft = window.innerWidth - VIEWPORT_PAD - tipWidth;
  let left = preferredLeft;
  if (left > maxLeft) {
    left = Math.min(anchorRight - tipWidth, maxLeft);
  }
  return Math.max(VIEWPORT_PAD, left);
}

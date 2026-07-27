import { useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { AUTH_REQUIRED_MESSAGE } from "@/lib/auth-gate";

interface AuthRequiredTipProps {
  visible: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  placement?: "right" | "below";
}

/** Large notice anchored next to the control that triggered it. */
export function AuthRequiredTip({
  visible,
  anchorRef,
  placement = "below",
}: AuthRequiredTipProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );

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
      if (placement === "right") {
        setCoords({
          top: rect.top + rect.height / 2,
          left: rect.right + 12,
        });
        return;
      }

      setCoords({
        top: rect.bottom + 10,
        left: rect.left,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [visible, anchorRef, placement]);

  if (!visible || !coords) {
    return null;
  }

  return createPortal(
    <div
      className={`auth-required-tip auth-required-tip-${placement}`}
      role="alert"
      style={
        placement === "right"
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

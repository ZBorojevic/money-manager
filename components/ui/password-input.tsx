"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<React.ComponentProps<"input">, "type"> & {
  toggleAriaLabel?: string;
};

const PasswordInput = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      className = "",
      toggleAriaLabel = "Toggle password visibility",
      ...props
    },
    ref
  ) => {
    const [show, setShow] = React.useState(false);

    const keepFocus = (e: React.MouseEvent) => e.preventDefault();

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={show ? "text" : "password"}
          suppressHydrationWarning
          className={[
            "w-full h-11 rounded-lg border pl-3 pr-11",
            "focus:outline-none focus:ring-1 focus:ring-slate-400",
            className,
          ].join(" ")}
          {...props}
        />

        <button
          type="button"
          aria-label={toggleAriaLabel}
          aria-pressed={show}
          onMouseDown={keepFocus}
          onPointerDown={keepFocus}
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 w-10 grid place-items-center text-slate-500 hover:text-slate-700 active:scale-[0.98]"
        >
          {show ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
import React, { useEffect, useState } from "react";
import { Children, Cls } from "./interfaces";

// https://flowbite.com/docs/components/buttons/
export function Btn({
  className,
  children,
  disabled,
  variant = "primary",
  size = "default",
  onClick,
}: {
  disabled?: boolean;
  onClick: () => any;
  variant?: "primary" | "secondary";
  size?: "default" | "small";
} & Children &
  Cls) {
  const [status, setStatus] = useState<
    "none" | "loading" | "disabled" | "error"
  >(disabled ? "disabled" : "none");

  useEffect(() => {
    setStatus(disabled ? "disabled" : "none");
  }, [disabled]);

  const doClick = async () => {
    if (disabled || status === "loading" || status === "disabled") {
      return;
    }
    setStatus("loading");
    try {
      await onClick();
      setStatus(disabled ? "disabled" : "none");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  return (
    <button
      onClick={doClick}
      disabled={status === "disabled" || status === "loading"}
      className={
        className +
        " rounded-3xl font-youth font-black " +
        (variant === "primary" ? " bg-accent text-font-on-accent" : " text-accent bg-surface-muted") +
        (status === "disabled" || status === "loading" ? " bg-surface-muted text-font-disabled" : "") +
        (size === "default"
          ? " py-3 px-6 text-base"
          : " py-1.5 px-4 text-sm leading-6")
      }
    >
      {children}
    </button>
  );
}

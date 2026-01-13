"use client";

import { ReactNode, useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  children: ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number; // Delay in milliseconds before showing tooltip
}

export default function Tooltip({
  children,
  text,
  position = "top",
  delay = 500, // Default 500ms delay
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for dark theme
  useEffect(() => {
    const checkTheme = () => {
      if (typeof document !== "undefined") {
        const theme = document.documentElement.getAttribute("data-theme");
        setIsDarkTheme(theme === "dark");
      }
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }

    return () => observer.disconnect();
  }, []);

  // Calculate tooltip position
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = 0;
    let y = 0;

    switch (position) {
      case "top":
        x = triggerRect.left + triggerRect.width / 2;
        y = triggerRect.top;
        // Adjust if tooltip would go off-screen
        if (x - tooltipRect.width / 2 < 8) {
          x = tooltipRect.width / 2 + 8;
        } else if (x + tooltipRect.width / 2 > viewportWidth - 8) {
          x = viewportWidth - tooltipRect.width / 2 - 8;
        }
        break;
      case "bottom":
        x = triggerRect.left + triggerRect.width / 2;
        y = triggerRect.bottom;
        // Adjust if tooltip would go off-screen
        if (x - tooltipRect.width / 2 < 8) {
          x = tooltipRect.width / 2 + 8;
        } else if (x + tooltipRect.width / 2 > viewportWidth - 8) {
          x = viewportWidth - tooltipRect.width / 2 - 8;
        }
        break;
      case "left":
        x = triggerRect.left;
        y = triggerRect.top + triggerRect.height / 2;
        // Adjust if tooltip would go off-screen
        if (y - tooltipRect.height / 2 < 8) {
          y = tooltipRect.height / 2 + 8;
        } else if (y + tooltipRect.height / 2 > viewportHeight - 8) {
          y = viewportHeight - tooltipRect.height / 2 - 8;
        }
        break;
      case "right":
        x = triggerRect.right;
        y = triggerRect.top + triggerRect.height / 2;
        // Adjust if tooltip would go off-screen
        if (y - tooltipRect.height / 2 < 8) {
          y = tooltipRect.height / 2 + 8;
        } else if (y + tooltipRect.height / 2 > viewportHeight - 8) {
          y = viewportHeight - tooltipRect.height / 2 - 8;
        }
        break;
    }

    setTooltipPosition({ x, y });
  };

  // Update position when tooltip should be rendered
  useEffect(() => {
    if (shouldRender) {
      // Use requestAnimationFrame to ensure tooltip is rendered before calculating position
      requestAnimationFrame(() => {
        calculatePosition();
      });
      const handleResize = () => {
        requestAnimationFrame(() => {
          calculatePosition();
        });
      };
      const handleScroll = () => {
        requestAnimationFrame(() => {
          calculatePosition();
        });
      };
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [shouldRender, position]);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShouldRender(true);
      // Small delay to ensure tooltip is rendered before calculating position
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    // Delay hiding the tooltip element to allow fade-out animation
    setTimeout(() => {
      setShouldRender(false);
      setTooltipPosition({ x: 0, y: 0 });
    }, 200);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipStyles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      position: "fixed",
      left: tooltipPosition.x,
      top: tooltipPosition.y,
      transform:
        position === "top"
          ? "translate(-50%, calc(-100% - 8px))"
          : position === "bottom"
          ? "translate(-50%, 8px)"
          : position === "left"
          ? "translate(calc(-100% - 8px), -50%)"
          : "translate(8px, -50%)",
      pointerEvents: "none",
      zIndex: 9999,
      opacity: isVisible ? 1 : 0,
      visibility: shouldRender ? "visible" : "hidden",
      transition: "opacity 0.2s ease-in-out",
    };
    return baseStyles;
  }, [tooltipPosition, position, isVisible, shouldRender]);

  const arrowStyles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      position: "absolute",
      width: 0,
      height: 0,
      borderStyle: "solid",
    };

    // Use lighter arrow color in dark mode to match the lighter tooltip background
    const arrowColor = isDarkTheme ? "#e5e7eb" : "#111827";

    switch (position) {
      case "top":
        return {
          ...baseStyles,
          bottom: "-6px",
          left: "50%",
          transform: "translateX(-50%)",
          borderWidth: "6px 6px 0 6px",
          borderColor: `${arrowColor} transparent transparent transparent`,
        };
      case "bottom":
        return {
          ...baseStyles,
          top: "-6px",
          left: "50%",
          transform: "translateX(-50%)",
          borderWidth: "0 6px 6px 6px",
          borderColor: `transparent transparent ${arrowColor} transparent`,
        };
      case "left":
        return {
          ...baseStyles,
          right: "-6px",
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: "6px 0 6px 6px",
          borderColor: `transparent transparent transparent ${arrowColor}`,
        };
      case "right":
        return {
          ...baseStyles,
          left: "-6px",
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: "6px 6px 6px 0",
          borderColor: `transparent ${arrowColor} transparent transparent`,
        };
    }
  }, [position, isDarkTheme]);

  // Use lighter background in dark mode for better contrast against dark backgrounds
  // In dark mode: light gray background with dark text
  // In light mode: dark background with white text
  const bgColor = isDarkTheme ? "bg-gray-100" : "bg-gray-900";
  const textColor = isDarkTheme ? "text-gray-900" : "text-white";
  const borderColor = isDarkTheme ? "border-gray-300" : "border-transparent";
  const shadowColor = isDarkTheme ? "shadow-[0_4px_12px_rgba(0,0,0,0.5)]" : "shadow-lg";

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {typeof document !== "undefined" &&
        shouldRender &&
        createPortal(
          <div
            ref={tooltipRef}
            style={tooltipStyles}
            className={`px-2 py-1 text-xs font-medium ${textColor} ${bgColor} border ${borderColor} rounded-md whitespace-nowrap ${shadowColor}`}
          >
            {text}
            <div style={arrowStyles} />
          </div>,
          document.body
        )}
    </>
  );
}

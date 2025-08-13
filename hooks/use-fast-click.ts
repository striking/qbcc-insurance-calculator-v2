"use client"

import { useEffect } from "react"

/**
 * A hook that eliminates the 300ms delay on click events on mobile devices
 * This improves the responsiveness of the UI on touch devices
 */
export function useFastClick() {
  useEffect(() => {
    // Only apply if the device supports touch events
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      // Add viewport meta tag to ensure proper rendering
      const viewportMeta = document.querySelector('meta[name="viewport"]')
      if (viewportMeta) {
        // Ensure we don't force user-scalable=no which is bad for accessibility
        if (!viewportMeta.getAttribute("content")?.includes("user-scalable=yes")) {
          viewportMeta.setAttribute(
            "content",
            "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes",
          )
        }
      }

      // Add touch-action CSS to improve touch response
      const style = document.createElement("style")
      style.innerHTML = `
        * {
          touch-action: manipulation;
        }
        
        input, button, a, [role="button"] {
          touch-action: manipulation;
        }
      `
      document.head.appendChild(style)
    }

    return () => {
      // Cleanup if needed
    }
  }, [])
}

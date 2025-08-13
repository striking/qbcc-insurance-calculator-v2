"use client"

import { useEffect } from "react"
import { initGTM, trackEvent } from "@/lib/gtm"

export function useGTM() {
  // Initialize GTM on component mount
  useEffect(() => {
    initGTM()
  }, [])

  return { trackEvent }
}

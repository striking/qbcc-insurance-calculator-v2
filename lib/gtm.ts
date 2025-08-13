// Google Tag Manager implementation

// GTM Container ID
export const GTM_ID = "GTM-MBLZJ6T2"

// Initialize GTM
export const initGTM = () => {
  if (typeof window !== "undefined" && window.dataLayer === undefined) {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    })
  }
}

// Push event to dataLayer
export const pushToDataLayer = (data: object) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push(data)
  }
}

// Custom events for GA4
export const trackEvent = (eventName: string, eventParams: object = {}) => {
  pushToDataLayer({
    event: eventName,
    ...eventParams,
  })
}

// Predefined events
export const events = {
  // Calculation events
  CALC_SUBMIT: "calc_submit",
  CALC_RESULT: "calc_result",
  CALC_ERROR: "calc_error",

  // Future events
  PDF_DOWNLOAD: "pdf_download",
  API_CALL: "api_call",
  OUTBOUND_AFFILIATE: "outbound_affiliate",

  // Navigation events
  PAGE_VIEW: "page_view",
  NAVIGATION: "navigation",
}

// Type definitions for window object
declare global {
  interface Window {
    dataLayer: any[]
  }
}

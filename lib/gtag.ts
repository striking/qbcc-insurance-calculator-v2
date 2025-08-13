// Helper functions for Google Analytics events

// Log a page view
export const pageview = (url: string, GA_MEASUREMENT_ID: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// Log a specific event
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label: string
  value?: number
}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

/**
 * Track payment-related events with detailed information
 *
 * This function provides more detailed tracking specifically for payment events,
 * capturing all relevant information about the payment process.
 */
export const trackPaymentEvent = ({
  action,
  calculationType,
  premium,
  insurableValue,
  units,
  errorType,
}: {
  action: string
  calculationType: string
  premium: number
  insurableValue: number
  units: number
  errorType?: string
}) => {
  if (typeof window !== "undefined" && window.gtag) {
    // Create a detailed event object with all payment-related information
    const eventParams = {
      event_category: "payment",
      event_label: calculationType.toLowerCase().replace(/\s+/g, "_"),
      value: Math.round(premium),

      // Additional detailed parameters
      premium_amount: premium.toFixed(2),
      insurable_value: insurableValue.toFixed(2),
      number_of_units: units,
      calculation_type: calculationType,
      timestamp: new Date().toISOString(),

      // Include error information if provided
      ...(errorType && { error_type: errorType }),
    }

    // Send the event to Google Analytics
    window.gtag("event", action, eventParams)

    // Log the event for debugging (can be removed in production)
    console.log(`Payment Event: ${action}`, eventParams)
  }
}

/**
 * Payment Event Types
 *
 * Common payment event actions:
 * - payment_button_clicked: When user clicks the Pay Now button
 * - payment_confirmed: When user confirms the payment dialog
 * - payment_canceled: When user cancels the payment dialog
 * - payment_redirect_success: When user is successfully redirected to payment site
 * - payment_error: When an error occurs during the payment process
 * - payment_completed: When payment is completed (future)
 */

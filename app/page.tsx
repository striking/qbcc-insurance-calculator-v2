"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Home, Wrench, Info, HelpCircle, RotateCcw, CreditCard, Plus, Minus } from "lucide-react"
import {
  calculateQLDHomeWarrantyPremium,
  calculateMultipleDwellingsPremium,
  calculateQLDRenovationPremium,
  calculateMultipleUnitsPremium,
} from "@/lib/premium-calculator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Script from "next/script"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { event, trackPaymentEvent } from "@/lib/gtag"
import { useMediaQuery } from "@/hooks/use-media-query"
import { PaymentModal } from "@/components/payment-modal"
import { PremiumBreakdown } from "@/components/premium-breakdown"
import { useFastClick } from "@/hooks/use-fast-click"

// Add the import for useGTM and events
import { useGTM } from "@/hooks/use-gtm"
import { events } from "@/lib/gtm"

// Australian locale for number formatting
const AU_LOCALE = "en-AU"

// Add the hook inside the component
export default function QBCCCalculator() {
  const { toast } = useToast()
  const { trackEvent } = useGTM()
  const [newConstructionValue, setNewConstructionValue] = useState<string>("")
  const [newConstructionUnits, setNewConstructionUnits] = useState<string>("1")
  const [newConstructionPremium, setNewConstructionPremium] = useState<number | null>(null)
  const [newConstructionOriginalValue, setNewConstructionOriginalValue] = useState<number | null>(null)
  const [newConstructionRoundedValue, setNewConstructionRoundedValue] = useState<number | null>(null)

  const [renovationValue, setRenovationValue] = useState<string>("")
  const [renovationUnits, setRenovationUnits] = useState<string>("1")
  const [renovationPremium, setRenovationPremium] = useState<number | null>(null)
  const [renovationOriginalValue, setRenovationOriginalValue] = useState<number | null>(null)
  const [renovationRoundedValue, setRenovationRoundedValue] = useState<number | null>(null)

  // Remove this line from the useState declarations:
  // const [error, setError] = useState<string | null>(null)

  const [isCalculating, setIsCalculating] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("new-construction")
  const [calculationHistory, setCalculationHistory] = useState<
    Array<{
      type: string
      value: number
      units: number
      premium: number
      timestamp: Date
    }>
  >([])

  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false)
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<boolean>(false)

  // Use the fast click hook to improve mobile responsiveness
  useFastClick()

  // Format number with commas
  const formatNumberWithCommas = (value: string): string => {
    // Remove any non-digit characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, "")

    // If empty, return empty string
    if (!numericValue) return ""

    // Parse as number and format with locale
    const num = Number.parseFloat(numericValue)
    if (isNaN(num)) return ""

    // Format with Australian locale
    return num.toLocaleString("en-AU", {
      maximumFractionDigits: 2,
      useGrouping: true,
    })
  }

  // Parse formatted number back to numeric string
  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, "")
  }

  // Format currency for display
  const formatCurrency = (value: number): string => {
    return value.toLocaleString(AU_LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Function to get premium calculation breakdown steps
  const getPremiumBreakdown = (
    type: "new-construction" | "renovation",
    originalValue: number | null,
    roundedValue: number | null,
    units: number,
    premium: number | null,
  ): Array<{ description: string; value: string }> => {
    if (!originalValue || !premium) return []

    const steps = []

    // Check if below minimum threshold
    if (originalValue < 3300) {
      steps.push({
        description: "Original insurable value",
        value: `$${originalValue.toLocaleString(AU_LOCALE)}`,
      })

      steps.push({
        description: "Below minimum threshold of $3,300",
        value: "$0.00",
      })

      return steps
    }

    // Step 1: Original value
    steps.push({
      description: "Original insurable value",
      value: `$${originalValue.toLocaleString(AU_LOCALE)}`,
    })

    // Step 2: Rounded value (if different)
    if (roundedValue && roundedValue !== originalValue) {
      steps.push({
        description: "Rounded up to next $1,000",
        value: `$${roundedValue.toLocaleString(AU_LOCALE)}`,
      })
    }

    // Special handling for values over $3M
    if (roundedValue && roundedValue > 3000000) {
      const baseAmount = type === "new-construction" ? 20671.45 : 14490.25
      const excess = roundedValue - 3000000
      const excessThousands = Math.ceil(excess / 1000)
      const additionalPremium = excessThousands * 3.2

      // Base premium for $3M
      steps.push({
        description: `Base premium for $3,000,000`,
        value: `$${formatCurrency(baseAmount)}`,
      })

      // Additional premium for amount over $3M
      steps.push({
        description: `Additional premium (${excessThousands} × $3.20 per $1,000 over $3M)`,
        value: `$${formatCurrency(additionalPremium)}`,
      })

      // If multiple units, show per-unit premium
      if (units > 1) {
        const totalPerUnit = baseAmount + additionalPremium
        steps.push({
          description: `Premium per unit`,
          value: `$${formatCurrency(totalPerUnit)}`,
        })

        steps.push({
          description: `Multiplied by ${units} units`,
          value: `$${formatCurrency(premium)}`,
        })
      }
    }
    // Standard calculation for values under $3M
    else {
      // Step 3: Base premium calculation
      const baseDescription =
        type === "new-construction" ? "Base premium for new construction" : "Base premium for renovation"

      const basePremium = units === 1 ? premium : premium / units
      steps.push({
        description: baseDescription,
        value: `$${formatCurrency(basePremium)}`,
      })

      // Step 4: Multiple units calculation (if applicable)
      if (units > 1) {
        steps.push({
          description: `Multiplied by ${units} units`,
          value: `$${formatCurrency(premium)}`,
        })
      }
    }

    // GST breakdown
    const netPremium = premium / 1.1
    const gstAmount = premium - netPremium

    steps.push({
      description: "Net premium (excl. GST)",
      value: `$${formatCurrency(netPremium)}`,
    })

    steps.push({
      description: "GST (10%)",
      value: `$${formatCurrency(gstAmount)}`,
    })

    steps.push({
      description: "Total premium (incl. GST)",
      value: `$${formatCurrency(premium)}`,
    })

    return steps
  }

  // Handle increment/decrement of insurable value
  const handleValueChange = (
    type: "new-construction" | "renovation",
    action: "increment" | "decrement",
    amount = 10000,
  ) => {
    if (type === "new-construction") {
      const currentValue = parseFormattedNumber(newConstructionValue)
      let newValue = Number.parseFloat(currentValue || "0")

      if (action === "increment") {
        newValue += amount
      } else {
        newValue = Math.max(0, newValue - amount)
      }

      setNewConstructionValue(formatNumberWithCommas(newValue.toString()))

      // Auto-calculate if we already have a result
      if (newConstructionPremium !== null) {
        // Use setTimeout to ensure state is updated before calculation
        setTimeout(() => calculateNewConstruction(), 0)
      }
    } else {
      const currentValue = parseFormattedNumber(renovationValue)
      let newValue = Number.parseFloat(currentValue || "0")

      if (action === "increment") {
        newValue += amount
      } else {
        newValue = Math.max(0, newValue - amount)
      }

      setRenovationValue(formatNumberWithCommas(newValue.toString()))

      // Auto-calculate if we already have a result
      if (renovationPremium !== null) {
        // Use setTimeout(() => calculateRenovation(), 0) to ensure state is updated before calculation
        setTimeout(() => calculateRenovation(), 0)
      }
    }

    // Track the interaction
    event({
      action: action === "increment" ? "increment_value" : "decrement_value",
      category: "user_interaction",
      label: `${type}_insurable_value`,
      value: amount,
    })
  }

  // Handle increment/decrement of units
  const handleUnitsChange = (type: "new-construction" | "renovation", action: "increment" | "decrement") => {
    if (type === "new-construction") {
      const currentUnits = Number.parseInt(newConstructionUnits || "1")
      let newUnits = currentUnits

      if (action === "increment") {
        newUnits += 1
      } else {
        newUnits = Math.max(1, newUnits - 1)
      }

      setNewConstructionUnits(newUnits.toString())

      // Auto-calculate if we already have a result
      if (newConstructionPremium !== null) {
        // Use setTimeout(() => calculateNewConstruction(), 0) to ensure state is updated before calculation
        setTimeout(() => calculateNewConstruction(), 0)
      }
    } else {
      const currentUnits = Number.parseInt(renovationUnits || "1")
      let newUnits = currentUnits

      if (action === "increment") {
        newUnits += 1
      } else {
        newUnits = Math.max(1, newUnits - 1)
      }

      setRenovationUnits(newUnits.toString())

      // Auto-calculate if we already have a result
      if (renovationPremium !== null) {
        // Use setTimeout(() => calculateRenovation(), 0) to ensure state is updated before calculation
        setTimeout(() => calculateRenovation(), 0)
      }
    }

    // Track the interaction
    event({
      action: action === "increment" ? "increment_value" : "decrement_value",
      category: "user_interaction",
      label: `${type}_units`,
      value: 1,
    })
  }

  // Schema.org JSON-LD structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "QBCC Home Warranty Insurance Calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "AUD",
    },
    description:
      "Calculate QBCC home warranty insurance premiums for new construction and renovations based on the July 2020 premium table.",
    featureList: [
      "Calculate premiums for new construction",
      "Calculate premiums for renovations and additions",
      "Support for multiple dwelling calculations",
      "Based on July 2020 QBCC premium rates",
    ],
    keywords:
      "QBCC, home warranty, insurance calculator, Queensland Building and Construction Commission, premium calculator",
    audience: {
      "@type": "Audience",
      audienceType: "Builders, Homeowners, Construction Industry",
    },
  }

  // Update the calculateNewConstruction function to use the new events
  const calculateNewConstruction = () => {
    try {
      setIsCalculating(true)

      // Track calculation submission
      trackEvent(events.CALC_SUBMIT, {
        calculation_type: "new_construction",
        units: Number.parseInt(newConstructionUnits),
      })

      const value = Number.parseFloat(parseFormattedNumber(newConstructionValue))
      const units = Number.parseInt(newConstructionUnits)

      // Only validate for NaN or negative values, not small values
      if (isNaN(value) || value < 0) {
        // Instead of setting error, just return early
        setIsCalculating(false)
        return
      }

      if (isNaN(units) || units <= 0) {
        // Instead of setting error, just return early
        setIsCalculating(false)
        return
      }

      // Store original value for display
      setNewConstructionOriginalValue(value)

      // Calculate rounded value (for display purposes)
      let roundedValue = value
      if (value >= 3300 && roundedValue % 1000 > 0) {
        roundedValue = Math.floor(roundedValue / 1000) * 1000 + 1000
      }
      setNewConstructionRoundedValue(roundedValue)

      // Calculate premium
      let premium
      if (units === 1) {
        premium = calculateQLDHomeWarrantyPremium(value)
      } else {
        premium = calculateMultipleDwellingsPremium(value, units)
      }

      setNewConstructionPremium(premium)

      // Add to history
      setCalculationHistory((prev) => [
        {
          type: "New Construction",
          value: value,
          units: units,
          premium: premium,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9), // Keep only the last 10 calculations
      ])

      // Track the calculation result event
      trackEvent(events.CALC_RESULT, {
        calculation_type: "new_construction",
        insurable_value: value,
        units: units,
        premium: premium,
        rounded_value: roundedValue,
      })

      // Keep the existing event tracking for backward compatibility
      event({
        action: "calculate_premium",
        category: "calculator",
        label: units === 1 ? "new_construction" : "new_construction_multiple",
        value: Math.round(value),
      })

      // Remove toast notification
      // toast({
      //   title: "Calculation Complete",
      //   description: `Premium calculated: $${formatCurrency(premium)}`,
      // })

      // Show detailed breakdown
      setShowDetailedBreakdown(true)
    } catch (err) {
      // Remove error setting
      // setError(err instanceof Error ? err.message : "An error occurred")
      setNewConstructionPremium(null)
      setNewConstructionOriginalValue(null)
      setNewConstructionRoundedValue(null)

      // Track error event
      trackEvent(events.CALC_ERROR, {
        calculation_type: "new_construction",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })

      // Keep the existing event tracking for backward compatibility
      event({
        action: "calculation_error",
        category: "calculator_errors",
        label: err instanceof Error ? err.message : "Unknown error",
        value: undefined,
      })
    } finally {
      setIsCalculating(false)
    }
  }

  // Similarly update the calculateRenovation function
  const calculateRenovation = () => {
    try {
      setIsCalculating(true)

      // Track calculation submission
      trackEvent(events.CALC_SUBMIT, {
        calculation_type: "renovation",
        units: Number.parseInt(renovationUnits),
      })

      const value = Number.parseFloat(parseFormattedNumber(renovationValue))
      const units = Number.parseInt(renovationUnits)

      // Only validate for NaN or negative values, not small values
      if (isNaN(value) || value < 0) {
        // Instead of setting error, just return early
        setIsCalculating(false)
        return
      }

      if (isNaN(units) || units <= 0) {
        // Instead of setting error, just return early
        setIsCalculating(false)
        return
      }

      // Store original value for display
      setRenovationOriginalValue(value)

      // Calculate rounded value for display purposes
      let roundedValue = value
      if (value >= 3300 && roundedValue % 1000 > 0) {
        roundedValue = Math.floor(roundedValue / 1000) * 1000 + 1000
      }
      setRenovationRoundedValue(roundedValue)

      // Calculate premium
      let premium
      if (units === 1) {
        premium = calculateQLDRenovationPremium(value)
      } else {
        premium = calculateMultipleUnitsPremium(value, units)
      }

      setRenovationPremium(premium)

      // Add to history
      setCalculationHistory((prev) => [
        {
          type: "Renovation",
          value: value,
          units: units,
          premium: premium,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9), // Keep only the last 10 calculations
      ])

      // Track the calculation result event
      trackEvent(events.CALC_RESULT, {
        calculation_type: "renovation",
        insurable_value: value,
        units: units,
        premium: premium,
        rounded_value: roundedValue,
      })

      // Keep the existing event tracking for backward compatibility
      event({
        action: "calculate_premium",
        category: "calculator",
        label: units === 1 ? "renovation" : "renovation_multiple",
        value: Math.round(value),
      })

      // Remove toast notification
      // toast({
      //   title: "Calculation Complete",
      //   description: `Premium calculated: $${formatCurrency(premium)}`,
      // })

      // Show detailed breakdown
      setShowDetailedBreakdown(true)
    } catch (err) {
      // Remove error setting
      // setError(err instanceof Error ? err.message : "An error occurred")
      setRenovationPremium(null)
      setRenovationOriginalValue(null)
      setRenovationRoundedValue(null)

      // Track error event
      trackEvent(events.CALC_ERROR, {
        calculation_type: "renovation",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })

      // Keep the existing event tracking for backward compatibility
      event({
        action: "calculation_error",
        category: "calculator_errors",
        label: err instanceof Error ? err.message : "Unknown error",
        value: undefined,
      })
    } finally {
      setIsCalculating(false)
    }
  }

  // Update the handlePayNow function to track outbound affiliate clicks
  const handlePayNow = () => {
    // Get the current premium value and calculation details
    const premium = activeTab === "new-construction" ? newConstructionPremium : renovationPremium
    const calculationType = activeTab === "new-construction" ? "New Construction" : "Renovation"
    const insurableValue = activeTab === "new-construction" ? newConstructionOriginalValue : renovationOriginalValue
    const units =
      activeTab === "new-construction" ? Number.parseInt(newConstructionUnits) : Number.parseInt(renovationUnits)

    if (!premium) {
      // Instead of toast, just return early
      trackPaymentEvent({
        action: "payment_error",
        errorType: "no_premium_calculated",
        calculationType: calculationType,
        premium: 0,
        insurableValue: 0,
        units: 0,
      })
      return
    }

    // Track button click event with detailed information
    trackEvent(events.OUTBOUND_AFFILIATE, {
      destination: "QBCC Payment Portal",
      calculation_type: calculationType.toLowerCase(),
      premium: premium,
      insurable_value: insurableValue || 0,
      units: units,
    })

    // Keep the existing event tracking for backward compatibility
    trackPaymentEvent({
      action: "payment_button_clicked",
      calculationType: calculationType,
      premium: premium,
      insurableValue: insurableValue || 0,
      units: units,
    })

    // Open the payment modal
    setPaymentModalOpen(true)
  }

  const resetForm = () => {
    // Track reset event
    event({
      action: "reset_form",
      category: "user_interaction",
      label: activeTab === "new-construction" ? "new_construction" : "renovation",
      value: undefined,
    })

    if (activeTab === "new-construction") {
      setNewConstructionValue("")
      setNewConstructionUnits("1")
      setNewConstructionPremium(null)
      setNewConstructionOriginalValue(null)
      setNewConstructionRoundedValue(null)
    } else {
      setRenovationValue("")
      setRenovationUnits("1")
      setRenovationPremium(null)
      setRenovationOriginalValue(null)
      setRenovationRoundedValue(null)
    }
    // Remove error setting
    // setError(null)
    setShowDetailedBreakdown(false)
  }

  // Add a new function for handling payments after the copyToClipboard function

  // Track tab changes
  const handleTabChange = (value: string) => {
    event({
      action: "tab_change",
      category: "user_interaction",
      label: value,
      value: undefined,
    })

    setActiveTab(value)
    // Remove error setting
    // setError(null)
    setShowDetailedBreakdown(false)
  }

  // Use the useMediaQuery hook to detect mobile devices
  const isMobile = useMediaQuery("(max-width: 640px)")

  return (
    <>
      <Script
        id="schema-org-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <main className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">QBCC Home Warranty Insurance Calculator</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Calculate premiums based on July 2020 premium table
              </p>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
              <ThemeToggle />
              <Link href="/guides">
                <Button variant="outline" size="sm" className="min-w-[80px]">
                  Guides
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="outline" size="sm" className="min-w-[80px]">
                  FAQ
                </Button>
              </Link>
            </div>
          </header>

          {/* Rate-date notice banner */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Premiums current as at 1 July 2020 – latest QBCC table.
              <a
                href="https://www.qbcc.qld.gov.au/sites/default/files/documents/hwi-premium-table-2701-alterations.pdf?utm_source=chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1 font-medium hover:text-blue-800 dark:hover:text-blue-200"
              >
                View official PDF
              </a>
            </p>
          </div>

          {/* Remove this entire error display div (around line 177): */}
          {/* {error && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6 flex items-center gap-2">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )} */}

          <section aria-label="Calculator">
            <Tabs defaultValue="new-construction" className="w-full" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="new-construction" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>New Construction</span>
                </TabsTrigger>
                <TabsTrigger value="renovation" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <span>Renovation/Addition</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new-construction">
                <div className="grid gap-6 md:grid-cols-5">
                  <Card className="md:col-span-3">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>New Construction</span>
                        <Badge variant="outline" className="ml-2">
                          July 2020 Rates
                        </Badge>
                      </CardTitle>
                      <CardDescription>Calculate premium for construction of a new residence</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="new-construction-value">Insurable Value ($)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                                  <HelpCircle className="h-4 w-4" />
                                  <span className="sr-only">Insurable Value Help</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  The insurable value is the contract price or the cost to build. Values are rounded up
                                  to the next $1,000. Minimum insurable value is $3,300.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`rounded-r-none border-r-0 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center`}
                            onClick={() => handleValueChange("new-construction", "decrement")}
                            aria-label="Decrease insurable value"
                          >
                            <Minus className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                          <Input
                            id="new-construction-value"
                            type="text"
                            inputMode="decimal"
                            placeholder="e.g. 250,000"
                            value={newConstructionValue}
                            onChange={(e) => {
                              const formatted = formatNumberWithCommas(e.target.value)
                              setNewConstructionValue(formatted)
                              // Auto-calculate on input change (for live results)
                              if (formatted) {
                                const timer = setTimeout(() => calculateNewConstruction(), 800)
                                return () => clearTimeout(timer)
                              }
                            }}
                            className="text-lg rounded-none text-center h-12 sm:h-10"
                            aria-label="Insurable Value for New Construction"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`rounded-l-none border-l-0 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center`}
                            onClick={() => handleValueChange("new-construction", "increment")}
                            aria-label="Increase insurable value"
                          >
                            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="new-construction-units">Number of Units</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                                  <HelpCircle className="h-4 w-4" />
                                  <span className="sr-only">Units Help</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  For multiple dwellings, the premium is calculated by dividing the total insurable
                                  value by the number of units.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`rounded-r-none border-r-0 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center`}
                            onClick={() => handleUnitsChange("new-construction", "decrement")}
                            aria-label="Decrease number of units"
                          >
                            <Minus className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                          <Input
                            id="new-construction-units"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            step="1"
                            placeholder="e.g. 1"
                            value={newConstructionUnits}
                            onChange={(e) => {
                              setNewConstructionUnits(e.target.value)
                              // Auto-calculate on input change
                              if (newConstructionValue) {
                                const timer = setTimeout(() => calculateNewConstruction(), 800)
                                return () => clearTimeout(timer)
                              }
                            }}
                            className="text-lg rounded-none text-center h-12 sm:h-10"
                            aria-label="Number of Units for New Construction"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`rounded-l-none border-l-0 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center`}
                            onClick={() => handleUnitsChange("new-construction", "increment")}
                            aria-label="Increase number of units"
                          >
                            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-full text-center text-sm text-muted-foreground">
                        {isCalculating ? (
                          <div className="flex items-center justify-center">
                            <span className="mr-2">Calculating</span>
                            <span className="flex gap-1">
                              <span className="animate-bounce inline-block h-1 w-1 bg-current rounded-full"></span>
                              <span className="animate-bounce inline-block h-1 w-1 bg-current rounded-full animation-delay-200"></span>
                              <span className="animate-bounce inline-block h-1 w-1 bg-current rounded-full animation-delay-500"></span>
                            </span>
                          </div>
                        ) : newConstructionValue ? (
                          <span>Results update automatically as you type</span>
                        ) : (
                          <span>Enter an insurable value to see results</span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        onClick={resetForm}
                        className="w-full sm:w-auto py-4 sm:py-2 text-base sm:text-sm mt-2 sm:mt-0"
                        aria-label="Reset Form"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </CardFooter>
                  </Card>

                  {newConstructionPremium !== null && newConstructionOriginalValue !== null && (
                    <Card className="md:col-span-2 print:block" id="result-card">
                      <CardHeader>
                        <CardTitle>Calculation Result</CardTitle>
                        <CardDescription>Based on July 2020 premium table</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Original Value:</span>
                            <span className="font-medium">
                              ${newConstructionOriginalValue?.toLocaleString(AU_LOCALE)}
                            </span>
                          </div>

                          {newConstructionRoundedValue !== newConstructionOriginalValue &&
                            newConstructionOriginalValue >= 3300 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Rounded Value:</span>
                                <span className="font-medium">
                                  ${newConstructionRoundedValue?.toLocaleString(AU_LOCALE)}
                                </span>
                              </div>
                            )}

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Number of Units:</span>
                            <span className="font-medium">{newConstructionUnits}</span>
                          </div>

                          <Separator className="my-3" />

                          <div className="flex justify-between items-end">
                            <span className="text-muted-foreground">Premium:</span>
                            <span className="text-3xl font-bold">
                              {newConstructionOriginalValue < 3300
                                ? "$0.00"
                                : `$${formatCurrency(newConstructionPremium)}`}
                            </span>
                          </div>

                          {/* Pay Now Button - Moved here from CardFooter */}
                          {newConstructionOriginalValue >= 3300 && (
                            <div className="mt-4 mb-2 print:hidden">
                              <Button
                                variant="primary"
                                onClick={handlePayNow}
                                aria-label="Pay Premium Now"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full py-6 text-lg"
                                id="pay-now-button"
                                data-premium={newConstructionPremium}
                                data-type="new-construction"
                              >
                                <CreditCard className="mr-2 h-5 w-5" />
                                Pay Now
                              </Button>
                            </div>
                          )}

                          {/* Premium Breakdown Visualization */}
                          {showDetailedBreakdown && (
                            <div className="mt-4">
                              <PremiumBreakdown
                                type="new-construction"
                                originalValue={newConstructionOriginalValue}
                                roundedValue={newConstructionRoundedValue || 0}
                                units={Number.parseInt(newConstructionUnits)}
                                premium={newConstructionPremium}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="renovation">
                <div className="grid gap-6 md:grid-cols-5">
                  <Card className="md:col-span-3">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Renovation/Addition</span>
                        <Badge variant="outline" className="ml-2">
                          July 2020 Rates
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Calculate premium for renovations, alterations, additions, repairs, extensions, or related
                        construction
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="renovation-value">Insurable Value ($)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                                  <HelpCircle className="h-4 w-4" />
                                  <span className="sr-only">Insurable Value Help</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  The insurable value is the contract price or the cost of the renovation work. Values
                                  are rounded up to the next $1,000. Minimum insurable value is $3,300.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`rounded-r-none border-r-0 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center`}
                            onClick={() => handleValueChange("renovation", "decrement")}
                            aria-label="Decrease insurable value"
                          >
                            <Minus className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                          <Input
                            id="renovation-value"
                            type="text"
                            inputMode="decimal"
                            placeholder="e.g. 100,000"
                            value={renovationValue}
                            onChange={(e) => {
                              const formatted = formatNumberWithCommas(e.target.value)
                              setRenovationValue(formatted)
                              // Auto-calculate on input change (for live results)
                              if (formatted) {
                                const timer = setTimeout(() => calculateRenovation(), 800)
                                return () => clearTimeout(timer)
                              }
                            }}
                            className="text-lg rounded-none text-center h-12 sm:h-10"
                            aria-label="Insurable Value for Renovation"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`rounded-l-none border-l-0 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center`}
                            onClick={() => handleValueChange("renovation", "increment")}
                            aria-label="Increase insurable value"
                          >
                            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="renovation-units">Number of Units</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                                  <HelpCircle className="h-4 w-4" />
                                  <span className="sr-only">Units Help</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Where notional pricing applies, a premium is payable for each residential unit.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`rounded-r-none border-r-0 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center`}
                            onClick={() => handleUnitsChange("renovation", "decrement")}
                            aria-label="Decrease number of units"
                          >
                            <Minus className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                          <Input
                            id="renovation-units"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            step="1"
                            placeholder="e.g. 1"
                            value={renovationUnits}
                            onChange={(e) => {
                              setRenovationUnits(e.target.value)
                              // Auto-calculate on input change
                              if (renovationValue) {
                                const timer = setTimeout(() => calculateRenovation(), 800)
                                return () => clearTimeout(timer)
                              }
                            }}
                            className="text-lg rounded-none text-center h-12 sm:h-10"
                            aria-label="Number of Units for Renovation"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`rounded-l-none border-l-0 h-12 w-12 sm:h-10 sm:w-10 flex items-center justify-center`}
                            onClick={() => handleUnitsChange("renovation", "increment")}
                            aria-label="Increase number of units"
                          >
                            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-full text-center text-sm text-muted-foreground">
                        {isCalculating ? (
                          <div className="flex items-center justify-center">
                            <span className="mr-2">Calculating</span>
                            <span className="flex gap-1">
                              <span className="animate-bounce inline-block h-1 w-1 bg-current rounded-full"></span>
                              <span className="animate-bounce inline-block h-1 w-1 bg-current rounded-full animation-delay-200"></span>
                              <span className="animate-bounce inline-block h-1 w-1 bg-current rounded-full animation-delay-500"></span>
                            </span>
                          </div>
                        ) : renovationValue ? (
                          <span>Results update automatically as you type</span>
                        ) : (
                          <span>Enter an insurable value to see results</span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        onClick={resetForm}
                        className="w-full sm:w-auto py-4 sm:py-2 text-base sm:text-sm mt-2 sm:mt-0"
                        aria-label="Reset Form"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </CardFooter>
                  </Card>

                  {renovationPremium !== null && renovationOriginalValue !== null && (
                    <Card className="md:col-span-2 print:block" id="result-card">
                      <CardHeader>
                        <CardTitle>Calculation Result</CardTitle>
                        <CardDescription>Based on July 2020 premium table</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Original Value:</span>
                            <span className="font-medium">${renovationOriginalValue?.toLocaleString(AU_LOCALE)}</span>
                          </div>

                          {renovationRoundedValue !== renovationOriginalValue && renovationOriginalValue >= 3300 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Rounded Value:</span>
                              <span className="font-medium">${renovationRoundedValue?.toLocaleString(AU_LOCALE)}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Number of Units:</span>
                            <span className="font-medium">{renovationUnits}</span>
                          </div>

                          <Separator className="my-3" />

                          <div className="flex justify-between items-end">
                            <span className="text-muted-foreground">Premium:</span>
                            <span className="text-3xl font-bold">
                              {renovationOriginalValue < 3300 ? "$0.00" : `$${formatCurrency(renovationPremium)}`}
                            </span>
                          </div>

                          {/* Pay Now Button - Moved here from CardFooter */}
                          {renovationOriginalValue >= 3300 && (
                            <div className="mt-4 mb-2 print:hidden">
                              <Button
                                variant="primary"
                                onClick={handlePayNow}
                                aria-label="Pay Premium Now"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full py-6 text-lg"
                                id="pay-now-button"
                                data-premium={renovationPremium}
                                data-type="renovation"
                              >
                                <CreditCard className="mr-2 h-5 w-5" />
                                Pay Now
                              </Button>
                            </div>
                          )}

                          {/* Premium Breakdown Visualization */}
                          {showDetailedBreakdown && (
                            <div className="mt-4">
                              <PremiumBreakdown
                                type="renovation"
                                originalValue={renovationOriginalValue}
                                roundedValue={renovationRoundedValue || 0}
                                units={Number.parseInt(renovationUnits)}
                                premium={renovationPremium}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {calculationHistory.length > 0 && (
            <section aria-label="Calculation History" className="mt-8 print:hidden">
              <h2 className="text-xl font-semibold mb-4">Recent Calculations</h2>
              <div className="overflow-x-auto -mx-4 sm:mx-0 table-container overflow-fix">
                <div className="min-w-full inline-block align-middle px-4 sm:px-0">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Value
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Units
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Premium
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {calculationHistory.map((calc, index) => (
                          <tr key={index} className="hover:bg-muted/50">
                            <td className="px-3 py-3 whitespace-nowrap text-sm">{calc.type}</td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm">
                              ${calc.value.toLocaleString(AU_LOCALE)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm">{calc.units}</td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm">${formatCurrency(calc.premium)}</td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm">
                              {calc.timestamp.toLocaleTimeString(AU_LOCALE)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section
            aria-label="Information"
            className="mt-8 p-4 border rounded-md bg-muted/50 print:bg-transparent print:border-none"
          >
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Premiums are based on the July 2020 premium table (current)</li>
                  <li>
                    The minimum insurable value is $3,300. Any amount below this threshold results in a premium of $0
                  </li>
                  <li>Values are rounded up to the next $1,000 as per QBCC rules</li>
                  <li>
                    For values over $3,000,000, special calculation rates apply:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>New Construction: $20,671.45 + ($3.20 for every $1,000 over $3,000,000)</li>
                      <li>Renovation: $14,490.25 + ($3.20 for every $1,000 over $3,000,000)</li>
                    </ul>
                  </li>
                  <li>All premium amounts include 10% Goods and Services Tax (GST)</li>
                  <li>
                    This calculator is for estimation purposes only. Please refer to the{" "}
                    <a
                      href="https://www.qbcc.qld.gov.au/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-primary"
                    >
                      QBCC website
                    </a>{" "}
                    for official premium calculations.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Payment Modal */}
          <PaymentModal
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            premium={activeTab === "new-construction" ? newConstructionPremium || 0 : renovationPremium || 0}
            onPaymentComplete={() => {
              // Track successful redirect
              trackPaymentEvent({
                action: "payment_redirect_success",
                calculationType: activeTab === "new-construction" ? "New Construction" : "Renovation",
                premium: activeTab === "new-construction" ? newConstructionPremium || 0 : renovationPremium || 0,
                insurableValue:
                  activeTab === "new-construction" ? newConstructionOriginalValue || 0 : renovationOriginalValue || 0,
                units:
                  activeTab === "new-construction"
                    ? Number.parseInt(newConstructionUnits)
                    : Number.parseInt(renovationUnits),
              })

              // Remove toast notification
              // toast({
              //   title: "Payment Initiated",
              //   description: "You've been redirected to the QBCC payment portal",
              // })
            }}
            calculationType={activeTab === "new-construction" ? "New Construction" : "Renovation"}
          />

          <footer className="mt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} QBCC Home Warranty Insurance Calculator</p>
            <p className="mt-1">
              This calculator is provided for informational purposes only and is not affiliated with the Queensland
              Building and Construction Commission.
            </p>
          </footer>

          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #result-card, #result-card * {
                visibility: visible;
              }
              #result-card {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                box-shadow: none;
                border: none;
              }
            }

            .table-container {
              width: 100%;
              overflow-x: auto;
            }

            .overflow-fix {
              overflow: auto;
            }
          `}</style>
        </div>
      </main>
    </>
  )
}

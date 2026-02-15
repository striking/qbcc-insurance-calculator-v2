import { QuoteTemplate } from "@/components/quote-template"
import { EstimateLeadCapture } from "@/components/estimate-lead-capture"
import { 
  calculateQLDHomeWarrantyPremium, 
  calculateMultipleDwellingsPremium, 
  calculateQLDRenovationPremium, 
  calculateMultipleUnitsPremium,
  calculateQLeaveLevy
} from "@/lib/premium-calculator"
import { Metadata } from "next"
import { notFound } from "next/navigation"

// Australian locale for number formatting
const AU_LOCALE = "en-AU"

interface Props {
  params: {
    type: string
    value: string
  }
  searchParams: {
    units?: string
  }
}

// Generate static params for common price points to make them instant (Static Site Generation)
export async function generateStaticParams() {
  const commonValues = [300000, 450000, 600000, 50000, 150000, 250000]
  
  const newConstructionParams = commonValues.map((value) => ({
    type: 'new-construction',
    value: value.toString(),
  }))

  const renovationParams = commonValues.map((value) => ({
    type: 'renovation',
    value: value.toString(),
  }))

  return [...newConstructionParams, ...renovationParams]
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { type, value } = params
  const insurableValue = Number(value)
  const units = Number(searchParams.units || "1")
  
  const formattedValue = insurableValue.toLocaleString(AU_LOCALE, { 
    style: 'currency', 
    currency: 'AUD',
    maximumFractionDigits: 0 
  })

  const typeName = type === 'renovation' ? 'Renovation' : 'New Construction'

  return {
    title: `QBCC Insurance Estimate: ${formattedValue} ${typeName}`,
    description: `Estimated QBCC Home Warranty Insurance and QLeave levy for a ${formattedValue} ${typeName.toLowerCase()} project.`,
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
      canonical: `https://qbccinsurancecalculator.com.au/estimate/${type}/${value}`,
    },
  }
}

export default function EstimatePage({ params, searchParams }: Props) {
  const { type, value } = params
  const units = Number(searchParams.units || "1")
  const insurableValue = Number(value)

  if (isNaN(insurableValue) || isNaN(units) || units < 1) {
    notFound()
  }

  if (type !== 'new-construction' && type !== 'renovation') {
    notFound()
  }

  // Calculate Logic (Server Side)
  let premium = 0
  if (type === "new-construction") {
    if (units === 1) {
      premium = calculateQLDHomeWarrantyPremium(insurableValue)
    } else {
      premium = calculateMultipleDwellingsPremium(insurableValue, units)
    }
  } else {
    if (units === 1) {
      premium = calculateQLDRenovationPremium(insurableValue)
    } else {
      premium = calculateMultipleUnitsPremium(insurableValue, units)
    }
  }

  const qleave = calculateQLeaveLevy(insurableValue)

  // Format value string for display (re-add commas)
  const formattedValueString = insurableValue.toLocaleString(AU_LOCALE, { maximumFractionDigits: 2 })

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <QuoteTemplate 
        workType={type}
        insurableValue={formattedValueString}
        units={units}
        premium={premium}
        qleave={qleave}
      />
      
      <EstimateLeadCapture 
        quoteData={{
          workType: type,
          insurableValue,
          units,
          premium,
          qleave
        }}
      />
      
      <div className="max-w-[210mm] mx-auto mt-8 text-center print:hidden">
        <a 
            href="/" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-leva-navy text-white hover:bg-leva-navy-light h-10 px-4 py-2"
        >
            Calculate Another Estimate
        </a>
      </div>
    </main>
  )
}
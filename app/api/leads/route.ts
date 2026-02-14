import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { Resend } from 'resend'
import { LeadCaptureData, LeadCaptureRequest, ApiResponse } from '@/lib/types'
import { buildQuoteEmailHtml } from '@/emails/quote-email'
import { buildLeadNotificationHtml } from '@/emails/lead-notification'

const LEADS_FILE = path.join(process.cwd(), 'data', 'leads.json')
const NOTIFICATIONS_FILE = path.join(process.cwd(), 'data', 'notifications.json')
const EMAIL_FROM = 'QBCC Calculator <noreply@grapl.ai>'

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(LEADS_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Read existing leads
async function readLeads(): Promise<LeadCaptureData[]> {
  try {
    const data = await fs.readFile(LEADS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Write leads to file
async function writeLeads(leads: LeadCaptureData[]): Promise<void> {
  await ensureDataDirectory()
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2))
}

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Keep JSON-based notification logging as fallback/audit trail
async function writeNotificationLog(lead: LeadCaptureData) {
  const notificationData = {
    timestamp: new Date().toISOString(),
    lead,
    subject: `New QBCC Calculator Lead: ${lead.email}`,
    message: `
New lead captured from QBCC Insurance Calculator:

Email: ${lead.email}
Name: ${lead.name || 'Not provided'}
Phone: ${lead.phone || 'Not provided'}
Source: ${lead.source}

Quote Details:
- Work Type: ${lead.quoteData.workType}
- Insurable Value: $${lead.quoteData.insurableValue.toLocaleString()}
- Units: ${lead.quoteData.units}
- QBCC Premium: $${lead.quoteData.premium.toFixed(2)}
- QLeave Levy: $${lead.quoteData.qleave.toFixed(2)}
- Total: $${lead.quoteData.total.toFixed(2)}

Captured at: ${lead.timestamp}
    `,
  }

  try {
    const existingNotifications = JSON.parse(await fs.readFile(NOTIFICATIONS_FILE, 'utf-8'))
    existingNotifications.push(notificationData)
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(existingNotifications, null, 2))
  } catch {
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify([notificationData], null, 2))
  }
}

async function sendLeadEmails(lead: LeadCaptureData) {
  const apiKey = process.env.RESEND_API_KEY
  const notificationEmail = process.env.NOTIFICATION_EMAIL

  if (!apiKey) {
    console.warn('[leads] RESEND_API_KEY is not set. Skipping email send and continuing with JSON storage only.')
    return
  }

  const resend = new Resend(apiKey)

  try {
    const userHtml = buildQuoteEmailHtml(lead)
    await resend.emails.send({
      from: EMAIL_FROM,
      to: [lead.email],
      subject: 'Your QBCC Insurance Quote',
      html: userHtml,
    })
  } catch (error) {
    console.error('[leads] Failed to send quote email to user:', error)
  }

  if (!notificationEmail) {
    console.warn('[leads] NOTIFICATION_EMAIL is not set. Skipping internal lead notification email.')
    return
  }

  try {
    const notificationHtml = buildLeadNotificationHtml(lead)
    await resend.emails.send({
      from: EMAIL_FROM,
      to: [notificationEmail],
      subject: `New QBCC Calculator Lead: ${lead.email}`,
      html: notificationHtml,
    })
  } catch (error) {
    console.error('[leads] Failed to send lead notification email:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadCaptureRequest = await request.json()

    // Validate required fields
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Valid email is required',
        },
        { status: 400 }
      )
    }

    if (!body.source) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Source is required',
        },
        { status: 400 }
      )
    }

    // Create lead data
    const leadData: LeadCaptureData = {
      email: body.email.toLowerCase().trim(),
      name: body.name?.trim(),
      phone: body.phone?.trim(),
      timestamp: new Date().toISOString(),
      source: body.source,
      quoteData: {
        workType: body.workType || '',
        insurableValue: body.insurableValue || 0,
        units: body.units || 1,
        premium: body.premium || 0,
        qleave: body.qleave || 0,
        total: (body.premium || 0) + (body.qleave || 0),
      },
    }

    // Save lead to JSON storage first (primary persistence)
    const leads = await readLeads()
    leads.push(leadData)
    await writeLeads(leads)

    // Keep local notification log + send emails asynchronously
    writeNotificationLog(leadData).catch((error) => {
      console.error('[leads] Failed to write notification log:', error)
    })

    sendLeadEmails(leadData).catch((error) => {
      console.error('[leads] Unexpected error while sending emails:', error)
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Lead captured successfully' },
    })
  } catch (error) {
    console.error('Error capturing lead:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Simple endpoint to view leads (could be protected in production)
  try {
    const leads = await readLeads()
    return NextResponse.json<ApiResponse>({
      success: true,
      data: leads,
    })
  } catch (error) {
    console.error('Error reading leads:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

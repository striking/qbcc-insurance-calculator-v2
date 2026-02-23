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

async function ensureDataDirectory() {
  const dataDir = path.dirname(LEADS_FILE)
  await fs.mkdir(dataDir, { recursive: true })
}

function isFsMissingFileError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'ENOENT'
}

async function readLeads(): Promise<LeadCaptureData[]> {
  try {
    const data = await fs.readFile(LEADS_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (isFsMissingFileError(error)) return []
    throw error
  }
}

async function writeLeads(leads: LeadCaptureData[]): Promise<void> {
  await ensureDataDirectory()
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2))
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isReadOnlyFsError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return false
  const code = (error as { code?: string }).code
  return code === 'EROFS' || code === 'EACCES' || code === 'EPERM'
}

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

  await ensureDataDirectory()

  let existingNotifications: unknown[] = []
  try {
    const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed)) {
      existingNotifications = parsed
    } else {
      console.warn('[leads] notifications.json is not an array; resetting log format')
    }
  } catch (error) {
    if (!isFsMissingFileError(error)) {
      console.error('[leads] Failed to read/parse notifications.json. Keeping previous file untouched.', error)
      return
    }
  }

  existingNotifications.push(notificationData)
  await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(existingNotifications, null, 2))
}

async function sendLeadEmails(lead: LeadCaptureData) {
  const apiKey = process.env.RESEND_API_KEY
  const notificationEmail = process.env.NOTIFICATION_EMAIL

  if (!apiKey) {
    console.warn('[leads] RESEND_API_KEY is not set. Skipping email send and continuing.')
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

    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Valid email is required' }, { status: 400 })
    }

    if (!body.source) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Source is required' }, { status: 400 })
    }

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

    try {
      const leads = await readLeads()
      leads.push(leadData)
      await writeLeads(leads)
    } catch (error) {
      if (isReadOnlyFsError(error)) {
        console.warn('[leads] Filesystem is read-only in this environment; skipping local lead persistence.')
      } else {
        console.error('[leads] Failed to persist lead to local JSON storage:', error)
      }
    }

    writeNotificationLog(leadData).catch((error) => {
      if (isReadOnlyFsError(error)) {
        console.warn('[leads] Filesystem is read-only in this environment; skipping notification log persistence.')
      } else {
        console.error('[leads] Failed to write notification log:', error)
      }
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
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const readToken = process.env.LEADS_READ_TOKEN
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  if (!readToken || token !== readToken) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const leads = await readLeads()
    return NextResponse.json<ApiResponse>({ success: true, data: leads })
  } catch (error) {
    console.error('Error reading leads:', error)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { LeadCaptureData, LeadCaptureRequest, ApiResponse } from '@/lib/types'

const LEADS_FILE = path.join(process.cwd(), 'data', 'leads.json')

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

// Send notification email (placeholder - could integrate with actual email service)
async function sendNotificationEmail(lead: LeadCaptureData) {
  // For now, just log to console and a notification file
  console.log(`New lead captured: ${lead.email}`)
  
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
    `
  }
  
  // Write to notifications file for Chris to review
  const notificationsFile = path.join(process.cwd(), 'data', 'notifications.json')
  try {
    const existingNotifications = JSON.parse(await fs.readFile(notificationsFile, 'utf-8'))
    existingNotifications.push(notificationData)
    await fs.writeFile(notificationsFile, JSON.stringify(existingNotifications, null, 2))
  } catch {
    await fs.writeFile(notificationsFile, JSON.stringify([notificationData], null, 2))
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadCaptureRequest = await request.json()
    
    // Validate required fields
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Valid email is required'
      }, { status: 400 })
    }
    
    if (!body.source) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Source is required'
      }, { status: 400 })
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
        total: (body.premium || 0) + (body.qleave || 0)
      }
    }
    
    // Read existing leads, add new one, and save
    const leads = await readLeads()
    leads.push(leadData)
    await writeLeads(leads)
    
    // Send notification (async, don't wait)
    sendNotificationEmail(leadData).catch(console.error)
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Lead captured successfully' }
    })
    
  } catch (error) {
    console.error('Error capturing lead:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Simple endpoint to view leads (could be protected in production)
  try {
    const leads = await readLeads()
    return NextResponse.json<ApiResponse>({
      success: true,
      data: leads
    })
  } catch (error) {
    console.error('Error reading leads:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
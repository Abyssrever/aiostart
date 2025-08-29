import { NextResponse } from 'next/server'
import { AI_CONFIG } from '@/lib/ai-config'

export async function GET() {
  return NextResponse.json({
    config: {
      provider: AI_CONFIG.provider,
      hasWebhookUrl: !!AI_CONFIG.webhookUrl,
      webhookUrl: AI_CONFIG.webhookUrl ? AI_CONFIG.webhookUrl.substring(0, 50) + '...' : 'N/A',
      timeout: AI_CONFIG.timeout
    },
    env: {
      AI_PROVIDER: process.env.AI_PROVIDER,
      AI_WEBHOOK_URL: process.env.AI_WEBHOOK_URL ? process.env.AI_WEBHOOK_URL.substring(0, 50) + '...' : 'N/A',
      AI_TIMEOUT: process.env.AI_TIMEOUT
    }
  })
}
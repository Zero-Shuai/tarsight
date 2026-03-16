import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'tarsight-frontend',
    version: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
    timestamp: new Date().toISOString(),
  })
}

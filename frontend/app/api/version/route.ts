import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
    revision: process.env.APP_REVISION || 'unknown',
    deployedAt: process.env.APP_DEPLOYED_AT || 'unknown',
    timestamp: new Date().toISOString(),
  })
}

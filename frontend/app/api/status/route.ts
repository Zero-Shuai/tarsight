import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'tarsight-frontend',
    version: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
    revision: process.env.APP_REVISION || 'unknown',
    releaseTag: process.env.APP_RELEASE_TAG || null,
    deployedAt: process.env.APP_DEPLOYED_AT || 'unknown',
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  })
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Permissions endpoint - not yet implemented' }, { status: 501 })
}
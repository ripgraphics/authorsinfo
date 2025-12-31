import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Settings endpoint - not yet implemented' }, { status: 501 })
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ message: 'Settings endpoint - not yet implemented' }, { status: 501 })
}
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Accept invitation endpoint - not yet implemented' }, { status: 501 })
}
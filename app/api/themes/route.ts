import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const themes = await prisma.theme.findMany({
    include: { _count: { select: { subjects: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json(themes)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const theme = await prisma.theme.create({
    data: { name: body.name, description: body.description, color: body.color || '#6366f1' },
  })
  return Response.json(theme, { status: 201 })
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const theme = await prisma.theme.findUnique({
    where: { id: parseInt(id) },
    include: { subjects: { include: { _count: { select: { fiches: true } } } } },
  })
  if (!theme) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(theme)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const theme = await prisma.theme.update({
    where: { id: parseInt(id) },
    data: { name: body.name, description: body.description, color: body.color },
  })
  return Response.json(theme)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.theme.delete({ where: { id: parseInt(id) } })
  return new Response(null, { status: 204 })
}

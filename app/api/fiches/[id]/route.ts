import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fiche = await prisma.fiche.findUnique({
    where: { id: parseInt(id) },
    include: {
      subject: { include: { theme: true } },
      questions: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!fiche) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(fiche)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const fiche = await prisma.fiche.update({
    where: { id: parseInt(id) },
    data: {
      title: body.title,
      concepts: JSON.stringify(body.concepts || []),
      summary: body.summary ?? undefined,
      keyNumbers: body.keyNumbers !== undefined ? JSON.stringify(body.keyNumbers) : undefined,
      sections: body.sections !== undefined ? JSON.stringify(body.sections) : undefined,
      content: body.content,
      deepening: body.deepening,
      tags: JSON.stringify(body.tags || []),
    },
  })
  return Response.json(fiche)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.fiche.delete({ where: { id: parseInt(id) } })
  return new Response(null, { status: 204 })
}

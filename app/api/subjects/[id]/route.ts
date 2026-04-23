import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const subject = await prisma.subject.findUnique({
    where: { id: parseInt(id) },
    include: {
      theme: true,
      fiches: {
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { questions: true } } },
      },
    },
  })
  if (!subject) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(subject)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const subject = await prisma.subject.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      description: body.description,
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      ...(body.expertiseLevel !== undefined && { expertiseLevel: body.expertiseLevel }),
    },
  })
  return Response.json(subject)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.subject.delete({ where: { id: parseInt(id) } })
  return new Response(null, { status: 204 })
}

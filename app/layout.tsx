import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Base de Connaissances',
  description: 'Apprenez, structurez et mémorisez vos connaissances',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

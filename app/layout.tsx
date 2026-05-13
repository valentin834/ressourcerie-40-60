import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BDD Outils — 40-60 Studio',
  description: 'Base de connaissances des outils, tips et ressources évalués pour le studio.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SecretárIA Dental',
  description: 'Sistema de gestão odontológica inteligente',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

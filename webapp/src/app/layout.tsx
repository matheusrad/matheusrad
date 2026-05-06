import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Layout/Sidebar'
import { Header }  from '@/components/Layout/Header'

export const metadata: Metadata = {
  title: 'SecretárIA Dental',
  description: 'Sistema de gestão odontológica inteligente',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}

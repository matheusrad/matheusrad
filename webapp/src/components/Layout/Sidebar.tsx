'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays, Users, BarChart2, MessageCircle,
  Instagram, FileText, Settings, Stethoscope,
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/agenda',    label: 'Agenda',     icon: CalendarDays  },
  { href: '/pacientes', label: 'Pacientes',  icon: Users         },
  { href: '/financeiro',label: 'Financeiro', icon: BarChart2     },
  { href: '/mensagens', label: 'Mensagens',  icon: MessageCircle },
  { href: '/instagram', label: 'Instagram',  icon: Instagram     },
  { href: '/documentos', label: 'Documentos', icon: FileText },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Stethoscope size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">SecretárIA Dental</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={18} className={active ? 'text-blue-600' : 'text-gray-400'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-gray-100">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Settings size={18} className="text-gray-400" />
          Configurações
        </Link>
      </div>
    </aside>
  )
}

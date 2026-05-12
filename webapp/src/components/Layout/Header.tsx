'use client'
import { useRouter } from 'next/navigation'
import { Bell, Search, MessageSquare, CheckSquare, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function Header() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-900">Consultório Dra. [Nome]</span>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors relative">
          <Search size={18} />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <MessageSquare size={18} />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <CheckSquare size={18} />
        </button>
        <div className="ml-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
          D
        </div>
        <button
          onClick={handleLogout}
          title="Sair"
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}

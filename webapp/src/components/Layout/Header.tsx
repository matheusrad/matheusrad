'use client'
import { useRouter } from 'next/navigation'
import { Bell, Search, MessageSquare, CheckSquare, LogOut, X, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'

interface Paciente {
  id: string
  nome: string
  cpf: string | null
  email: string | null
  telefone: string | null
}

function BuscaPaciente({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); return }

    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('pacientes')
        .select('id, nome, cpf, email, telefone')
        .or(`nome.ilike.%${q}%,cpf.ilike.%${q}%,email.ilike.%${q}%`)
        .order('nome')
        .limit(8)
      setResults(data ?? [])
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(id: string) {
    onClose()
    router.push(`/pacientes?id=${id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome, CPF ou e-mail..."
            className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={16} />
          </button>
        </div>

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {results.map(p => (
              <li key={p.id}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                  onClick={() => handleSelect(p.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.nome}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {[p.cpf, p.email].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim().length >= 2 && !loading && results.length === 0 && (
          <p className="px-4 py-6 text-sm text-center text-gray-400">Nenhum paciente encontrado.</p>
        )}

        {query.trim().length < 2 && (
          <p className="px-4 py-4 text-xs text-center text-gray-300">Digite ao menos 2 caracteres para buscar.</p>
        )}
      </div>
    </div>
  )
}

export function Header() {
  const router = useRouter()
  const [buscaAberta, setBuscaAberta] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-900">Consultório Dra. Lorena Coutinho</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setBuscaAberta(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors relative"
            title="Buscar paciente"
          >
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

      {buscaAberta && <BuscaPaciente onClose={() => setBuscaAberta(false)} />}
    </>
  )
}

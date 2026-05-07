'use client'
import { useState } from 'react'
import { Plus, Search, X, FlaskConical } from 'lucide-react'

type Status = 'solicitacao' | 'enviado' | 'retornado' | 'instalado'

interface Protese {
  id: string
  paciente: string
  laboratorio: string
  responsavel: string
  tipo: string
  status: Status
  data: string
}

const COLUMNS: { id: Status; label: string; color: string; dot: string }[] = [
  { id: 'solicitacao', label: 'Solicitação',              color: 'text-blue-600',   dot: 'bg-blue-500'   },
  { id: 'enviado',     label: 'Enviado para laboratório', color: 'text-orange-500', dot: 'bg-orange-500' },
  { id: 'retornado',   label: 'Retornado à Clínica',      color: 'text-purple-600', dot: 'bg-purple-500' },
  { id: 'instalado',   label: 'Instalado',                color: 'text-green-600',  dot: 'bg-green-500'  },
]

function NovaProtese({ onSave, onClose }: { onSave: (p: Omit<Protese, 'id'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ paciente: '', laboratorio: '', responsavel: '', tipo: '', data: new Date().toISOString().split('T')[0] })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.paciente || !form.tipo) return
    onSave({ ...form, status: 'solicitacao' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900">Nova solicitação de prótese</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Paciente *</label>
            <input className="input" placeholder="Nome do paciente" value={form.paciente} onChange={e => setForm(f => ({ ...f, paciente: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de prótese *</label>
            <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} required>
              <option value="">Selecione...</option>
              <option>Coroa metalo-cerâmica</option>
              <option>Coroa de zircônia</option>
              <option>Prótese parcial removível</option>
              <option>Prótese total</option>
              <option>Implante</option>
              <option>Faceta</option>
              <option>Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Laboratório</label>
            <input className="input" placeholder="Nome do laboratório" value={form.laboratorio} onChange={e => setForm(f => ({ ...f, laboratorio: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Responsável</label>
            <input className="input" placeholder="Dentista responsável" value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data da solicitação</label>
            <input type="date" className="input" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Criar solicitação</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ControleProtesePage() {
  const [proteses, setProteses] = useState<Protese[]>([])
  const [busca, setBusca] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)

  const filtradas = proteses.filter(p => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return (
      p.paciente.toLowerCase().includes(q) ||
      p.laboratorio.toLowerCase().includes(q) ||
      p.responsavel.toLowerCase().includes(q)
    )
  })

  const addProtese = (p: Omit<Protese, 'id'>) => {
    setProteses(prev => [...prev, { ...p, id: crypto.randomUUID() }])
  }

  const moveCard = (id: string, newStatus: Status) => {
    setProteses(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Controle de Prótese</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 w-72"
              placeholder="Paciente, laboratório ou responsável"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Nova solicitação
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const cards = filtradas.filter(p => p.status === col.id)
          return (
            <div
              key={col.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragging) { moveCard(dragging, col.id); setDragging(null) } }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                </div>
                <span className={`text-xs font-bold ${col.color}`}>{cards.length}</span>
              </div>

              <div className="p-3 min-h-[420px]">
                {cards.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-100 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-400">Arraste um card para cá</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cards.map(card => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => setDragging(card.id)}
                        onDragEnd={() => setDragging(null)}
                        className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors border border-gray-100"
                      >
                        <p className="text-sm font-medium text-gray-800">{card.paciente}</p>
                        <p className="text-xs text-blue-600 mt-0.5">{card.tipo}</p>
                        {card.laboratorio && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <FlaskConical size={10} className="text-gray-400" />
                            <p className="text-xs text-gray-500">{card.laboratorio}</p>
                          </div>
                        )}
                        {card.data && (
                          <p className="text-xs text-gray-400 mt-1">{new Date(card.data + 'T12:00').toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center mt-6">
        <p className="text-xs text-gray-400">
          Dúvidas sobre o controle de prótese?{' '}
          <button className="text-blue-500 hover:underline">Aprenda a usar clicando aqui.</button>
        </p>
      </div>

      {showModal && (
        <NovaProtese onSave={addProtese} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

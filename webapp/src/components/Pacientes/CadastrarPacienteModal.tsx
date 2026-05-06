'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function CadastrarPacienteModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    nome: '', telefone: '', cpf: '', email: '',
    data_nascimento: '', profissao: '', endereco: '',
    plano_odontologico: '', observacoes_clinicas: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim() || !form.telefone.trim()) {
      setError('Nome e telefone são obrigatórios.')
      return
    }
    setSaving(true)
    const { error: err } = await supabase.from('pacientes').insert({
      nome:                form.nome.trim(),
      telefone:            form.telefone.replace(/\D/g, ''),
      cpf:                 form.cpf || null,
      email:               form.email || null,
      data_nascimento:     form.data_nascimento || null,
      profissao:           form.profissao || null,
      endereco:            form.endereco || null,
      plano_odontologico:  form.plano_odontologico || null,
      observacoes_clinicas: form.observacoes_clinicas || null,
      status:              'Ativo',
      novo_paciente:       true,
      total_consultas:     0,
      tem_alergia:         false,
      usa_medicamento:     false,
      tem_doenca_sistemica: false,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Cadastrar Paciente</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo *</label>
              <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Telefone / WhatsApp *</label>
              <input className="input" placeholder="(11) 99999-9999" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CPF</label>
              <input className="input" placeholder="000.000.000-00" value={form.cpf} onChange={e => set('cpf', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data de nascimento</label>
              <input type="date" className="input" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Profissão</label>
              <input className="input" value={form.profissao} onChange={e => set('profissao', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Plano odontológico</label>
              <input className="input" value={form.plano_odontologico} onChange={e => set('plano_odontologico', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Endereço</label>
              <input className="input" value={form.endereco} onChange={e => set('endereco', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações clínicas</label>
              <textarea className="input resize-none" rows={3} value={form.observacoes_clinicas} onChange={e => set('observacoes_clinicas', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

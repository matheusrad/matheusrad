'use client'
import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, User, MapPin, ClipboardList, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
  onSaved: () => void
}

const STEPS = ['Identificação', 'Contato e Endereço', 'Informações Complementares']

export function CadastrarPacienteModal({ onClose, onSaved }: Props) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    nome: '', data_nascimento: '', sexo: '', cpf: '', rg: '',
    estado_civil: '', nacionalidade: 'Brasileira', profissao: '',
    telefone: '', email: '', cep: '', rua: '', numero_endereco: '',
    complemento: '', bairro: '', cidade: '', estado_uf: '',
    filiacao: '', responsavel: '', indicacao: '', plano_odontologico: '',
    numero_carteirinha: '', observacoes_clinicas: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // CEP lookup via ViaCEP
  async function buscarCep(cep: string) {
    const clean = cep.replace(/\D/g, '')
    set('cep', cep)
    if (clean.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(f => ({
          ...f,
          rua: data.logradouro || f.rua,
          bairro: data.bairro || f.bairro,
          cidade: data.localidade || f.cidade,
          estado_uf: data.uf || f.estado_uf,
        }))
      }
    } catch {}
    setBuscandoCep(false)
  }

  // Phone mask
  function maskPhone(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }

  // CPF mask
  function maskCpf(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11)
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/[.-]$/, '')
  }

  // CEP mask
  function maskCep(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 8)
    return d.replace(/(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, '')
  }

  function validateStep() {
    if (step === 0 && !form.nome.trim()) { setError('Nome completo é obrigatório.'); return false }
    if (step === 1 && !form.telefone.trim()) { setError('Telefone é obrigatório.'); return false }
    setError('')
    return true
  }

  function next() {
    if (validateStep()) setStep(s => s + 1)
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.telefone.trim()) {
      setError('Nome e telefone são obrigatórios.')
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await (supabase.from('pacientes') as any).insert({
      nome: form.nome.trim(),
      telefone: form.telefone.replace(/\D/g, ''),
      cpf: form.cpf || null,
      rg: form.rg || null,
      email: form.email || null,
      data_nascimento: form.data_nascimento || null,
      sexo: form.sexo || null,
      estado_civil: form.estado_civil || null,
      nacionalidade: form.nacionalidade || null,
      profissao: form.profissao || null,
      cep: form.cep.replace(/\D/g, '') || null,
      rua: form.rua || null,
      numero_endereco: form.numero_endereco || null,
      complemento: form.complemento || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado_uf: form.estado_uf || null,
      endereco: [form.rua, form.numero_endereco, form.bairro, form.cidade].filter(Boolean).join(', ') || null,
      filiacao: form.filiacao || null,
      responsavel: form.responsavel || null,
      indicacao: form.indicacao || null,
      plano_odontologico: form.plano_odontologico || null,
      numero_carteirinha: form.numero_carteirinha || null,
      observacoes_clinicas: form.observacoes_clinicas || null,
      status: 'Ativo',
      novo_paciente: true,
      total_consultas: 0,
      tem_alergia: false,
      usa_medicamento: false,
      tem_doenca_sistemica: false,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )

  const chips = (key: string, options: string[]) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => set(key, form[key as keyof typeof form] === opt ? '' : opt)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
            form[key as keyof typeof form] === opt
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}>
          {opt}
        </button>
      ))}
    </div>
  )

  const ICONS = [User, MapPin, ClipboardList]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Cadastrar Paciente</h2>
            <p className="text-xs text-gray-400 mt-0.5">{STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-6 py-3 border-b border-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const Icon = ICONS[i]
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < step ? <span className="text-xs font-bold">✓</span> : <Icon size={13} />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-blue-600' : i < step ? 'text-gray-500' : 'text-gray-400'}`}>
                    {s}
                  </span>
                  {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Step 0: Identificação */}
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Nome completo" required>
                <input className="input w-full" placeholder="Nome como consta no documento"
                  value={form.nome} onChange={e => set('nome', e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Data de nascimento">
                  <input type="date" className="input w-full" value={form.data_nascimento}
                    onChange={e => set('data_nascimento', e.target.value)} />
                </Field>
                <Field label="Profissão">
                  <input className="input w-full" placeholder="Ex: Professora"
                    value={form.profissao} onChange={e => set('profissao', e.target.value)} />
                </Field>
              </div>

              <Field label="Sexo">
                {chips('sexo', ['Masculino', 'Feminino', 'Outro', 'Não informado'])}
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="CPF">
                  <input className="input w-full" placeholder="000.000.000-00"
                    value={form.cpf} onChange={e => set('cpf', maskCpf(e.target.value))} />
                </Field>
                <Field label="RG">
                  <input className="input w-full" placeholder="00.000.000-0"
                    value={form.rg} onChange={e => set('rg', e.target.value)} />
                </Field>
              </div>

              <Field label="Estado civil">
                {chips('estado_civil', ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'])}
              </Field>

              <Field label="Nacionalidade">
                <input className="input w-full" placeholder="Ex: Brasileira"
                  value={form.nacionalidade} onChange={e => set('nacionalidade', e.target.value)} />
              </Field>
            </div>
          )}

          {/* Step 1: Contato e Endereço */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone / WhatsApp" required>
                  <input className="input w-full" placeholder="(11) 99999-9999"
                    value={form.telefone} onChange={e => set('telefone', maskPhone(e.target.value))} />
                </Field>
                <Field label="E-mail">
                  <input type="email" className="input w-full" placeholder="email@exemplo.com"
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </Field>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Endereço</p>
                <div className="space-y-3">
                  <Field label="CEP">
                    <div className="relative">
                      <input className="input w-full pr-9" placeholder="00000-000"
                        value={form.cep} onChange={e => buscarCep(maskCep(e.target.value))} />
                      {buscandoCep ? (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      )}
                    </div>
                  </Field>

                  <Field label="Rua / Logradouro">
                    <input className="input w-full" placeholder="Nome da rua"
                      value={form.rua} onChange={e => set('rua', e.target.value)} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Número">
                      <input className="input w-full" placeholder="Ex: 123"
                        value={form.numero_endereco} onChange={e => set('numero_endereco', e.target.value)} />
                    </Field>
                    <Field label="Complemento">
                      <input className="input w-full" placeholder="Apto, Casa..."
                        value={form.complemento} onChange={e => set('complemento', e.target.value)} />
                    </Field>
                  </div>

                  <Field label="Bairro">
                    <input className="input w-full" placeholder="Nome do bairro"
                      value={form.bairro} onChange={e => set('bairro', e.target.value)} />
                  </Field>

                  <div className="grid grid-cols-[1fr_80px] gap-3">
                    <Field label="Cidade">
                      <input className="input w-full" placeholder="Nome da cidade"
                        value={form.cidade} onChange={e => set('cidade', e.target.value)} />
                    </Field>
                    <Field label="Estado">
                      <input className="input w-full uppercase" placeholder="SP" maxLength={2}
                        value={form.estado_uf} onChange={e => set('estado_uf', e.target.value.toUpperCase())} />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Informações Complementares */}
          {step === 2 && (
            <div className="space-y-4">
              <Field label="Filiação (nome do pai / nome da mãe)">
                <textarea className="input resize-none w-full" rows={2}
                  placeholder="Ex: Maria da Silva (mãe) / João da Silva (pai)"
                  value={form.filiacao} onChange={e => set('filiacao', e.target.value)} />
              </Field>

              <Field label="Responsável legal (se menor de idade)">
                <input className="input w-full" placeholder="Nome do responsável"
                  value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
              </Field>

              <Field label="Como conheceu a clínica / Indicação">
                <input className="input w-full" placeholder="Ex: Indicação de amigo, Google, Instagram..."
                  value={form.indicacao} onChange={e => set('indicacao', e.target.value)} />
              </Field>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Plano Odontológico</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Plano">
                    <input className="input w-full" placeholder="Ex: Unimed Dental"
                      value={form.plano_odontologico} onChange={e => set('plano_odontologico', e.target.value)} />
                  </Field>
                  <Field label="N° carteirinha">
                    <input className="input w-full" placeholder="Número"
                      value={form.numero_carteirinha} onChange={e => set('numero_carteirinha', e.target.value)} />
                  </Field>
                </div>
              </div>

              <Field label="Observações clínicas">
                <textarea className="input resize-none w-full" rows={3}
                  placeholder="Informações importantes para o atendimento..."
                  value={form.observacoes_clinicas} onChange={e => set('observacoes_clinicas', e.target.value)} />
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-blue-600' : i < step ? 'bg-blue-300' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="btn-secondary flex items-center gap-1">
                <ChevronLeft size={14} /> Anterior
              </button>
            )}
            {step === 0 && (
              <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary flex items-center gap-1">
                Próximo <ChevronRight size={14} />
              </button>
            ) : (
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Cadastrar paciente'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

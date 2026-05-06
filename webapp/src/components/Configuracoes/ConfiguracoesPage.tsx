'use client'
import { useState } from 'react'
import { Save, User, Building, Webhook, Bell, Shield, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

type Secao = 'clinica' | 'dentista' | 'integracoes' | 'notificacoes' | 'seguranca'

const secoes: { id: Secao; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'clinica',       label: 'Clínica',            icon: Building, desc: 'Dados da consultório, endereço e fiscal' },
  { id: 'dentista',      label: 'Dentista',            icon: User,     desc: 'Perfil, CRO e assinatura digital' },
  { id: 'integracoes',   label: 'Integrações',         icon: Webhook,  desc: 'n8n, Evolution API, Supabase, Instagram' },
  { id: 'notificacoes',  label: 'Notificações',        icon: Bell,     desc: 'Lembretes automáticos e alertas' },
  { id: 'seguranca',     label: 'Segurança',           icon: Shield,   desc: 'Senha, acesso e backup de dados' },
]

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, placeholder, type = 'text', defaultValue }: { label: string; placeholder?: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input className="input w-full" type={type} placeholder={placeholder} defaultValue={defaultValue} />
    </div>
  )
}

function Toggle({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false)
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => setOn(!on)}
        className={clsx('w-11 h-6 rounded-full transition-colors relative shrink-0 ml-4', on ? 'bg-blue-600' : 'bg-gray-200')}>
        <span className={clsx('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}

export function ConfiguracoesPage() {
  const [secaoAtiva, setSecaoAtiva] = useState<Secao>('clinica')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await new Promise(r => setTimeout(r, 800))
    setSalvando(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <button onClick={salvar} disabled={salvando} className="btn-primary disabled:opacity-60">
          <Save size={15} /> {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Menu lateral */}
        <div className="w-56 shrink-0">
          <div className="card overflow-hidden">
            {secoes.map(s => {
              const Icon = s.icon
              return (
                <button key={s.id} onClick={() => setSecaoAtiva(s.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-gray-50 last:border-0 transition-colors',
                    s.id === secaoAtiva ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}>
                  <Icon size={16} className={s.id === secaoAtiva ? 'text-blue-600' : 'text-gray-400'} />
                  <span className={clsx('text-sm font-medium', s.id === secaoAtiva ? 'text-blue-700' : 'text-gray-700')}>
                    {s.label}
                  </span>
                  <ChevronRight size={14} className="ml-auto text-gray-300" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 card p-6 space-y-6">

          {secaoAtiva === 'clinica' && (
            <>
              <FieldGroup label="Dados do consultório">
                <Field label="Razão social" placeholder="Ex: Dra. Ana Silva Odontologia LTDA" defaultValue="Clínica Odontológica" />
                <Field label="CNPJ" placeholder="00.000.000/0001-00" />
                <Field label="Inscrição municipal" placeholder="Número de inscrição municipal" />
                <Field label="Código de serviço (NFS-e)" placeholder="Ex: 8630" defaultValue="8630" />
              </FieldGroup>
              <FieldGroup label="Endereço">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rua" placeholder="Nome da rua" />
                  <Field label="Número" placeholder="123" />
                  <Field label="Bairro" placeholder="Bairro" />
                  <Field label="CEP" placeholder="00000-000" />
                  <Field label="Cidade" placeholder="São Paulo" />
                  <Field label="Estado" placeholder="SP" />
                </div>
              </FieldGroup>
              <FieldGroup label="Contato">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Telefone/WhatsApp" placeholder="(11) 99999-9999" />
                  <Field label="E-mail" type="email" placeholder="contato@clinica.com.br" />
                </div>
              </FieldGroup>
            </>
          )}

          {secaoAtiva === 'dentista' && (
            <>
              <FieldGroup label="Perfil profissional">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">D</div>
                  <button className="btn-secondary text-xs">Alterar foto</button>
                </div>
                <Field label="Nome completo" placeholder="Dra. Ana Silva" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CRO" placeholder="CRO-SP 00000" />
                  <Field label="Especialidade" placeholder="Clínico Geral" defaultValue="Clínico Geral" />
                </div>
                <Field label="E-mail profissional" type="email" placeholder="dra.ana@clinica.com.br" />
              </FieldGroup>
              <FieldGroup label="Horários de atendimento">
                {['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'].map(dia => (
                  <div key={dia} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20 shrink-0">{dia}</span>
                    <input className="input w-24" type="time" defaultValue="08:00" />
                    <span className="text-gray-400 text-sm">até</span>
                    <input className="input w-24" type="time" defaultValue="18:00" />
                  </div>
                ))}
              </FieldGroup>
            </>
          )}

          {secaoAtiva === 'integracoes' && (
            <>
              <FieldGroup label="Supabase">
                <Field label="URL do projeto" placeholder="https://xxx.supabase.co" />
                <Field label="Chave anônima (anon key)" placeholder="eyJ..." type="password" />
              </FieldGroup>
              <FieldGroup label="n8n (automações)">
                <Field label="URL do n8n" placeholder="http://localhost:5678" defaultValue="http://localhost:5678" />
                <Field label="Webhook — Prescrição/Laudo" placeholder="https://n8n.local/webhook/prescricao" />
                <Field label="Webhook — Nota Fiscal" placeholder="https://n8n.local/webhook/nota-fiscal" />
              </FieldGroup>
              <FieldGroup label="Evolution API (WhatsApp)">
                <Field label="URL da Evolution API" placeholder="http://localhost:8080" defaultValue="http://localhost:8080" />
                <Field label="API Key" type="password" placeholder="Chave de autenticação" />
                <Field label="Instância" placeholder="nome-da-instancia" />
              </FieldGroup>
              <FieldGroup label="Instagram (Meta Graph API)">
                <Field label="Access Token" type="password" placeholder="Token de longa duração" />
                <Field label="Instagram User ID" placeholder="1234567890" />
              </FieldGroup>
            </>
          )}

          {secaoAtiva === 'notificacoes' && (
            <div className="divide-y divide-gray-50">
              <Toggle label="Confirmação de consulta semanal" desc="Envia WhatsApp segunda-feira às 8h para pacientes da semana" defaultChecked />
              <Toggle label="Lembrete 24h antes" desc="Avisa o paciente um dia antes da consulta" defaultChecked />
              <Toggle label="Aniversariantes do mês" desc="Parabeniza pacientes no dia do aniversário" defaultChecked />
              <Toggle label="Retorno semestral" desc="Lembrete para pacientes sem consulta há 6 meses" />
              <Toggle label="Alerta de inadimplência" desc="Notifica consultas não comparecidas" defaultChecked />
              <Toggle label="Notificação de nova mensagem" desc="Alerta no painel ao receber mensagem no WhatsApp" defaultChecked />
            </div>
          )}

          {secaoAtiva === 'seguranca' && (
            <>
              <FieldGroup label="Alterar senha">
                <Field label="Senha atual" type="password" placeholder="••••••••" />
                <Field label="Nova senha" type="password" placeholder="••••••••" />
                <Field label="Confirmar nova senha" type="password" placeholder="••••••••" />
              </FieldGroup>
              <FieldGroup label="Backup de dados">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Backup automático no Supabase</p>
                    <p className="text-xs text-gray-500 mt-0.5">Dados protegidos com replicação em tempo real</p>
                  </div>
                  <span className="badge badge-green">Ativo</span>
                </div>
                <button className="btn-secondary text-sm w-full justify-center">
                  Exportar todos os dados (CSV)
                </button>
              </FieldGroup>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

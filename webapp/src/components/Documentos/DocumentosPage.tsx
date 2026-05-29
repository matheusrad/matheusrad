'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { FileText, Plus, Search, Printer, X, Trash2, ChevronDown, Check, Send, AlertTriangle, AlertCircle, Info, Loader2, BookOpen, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getRxCUI, verificarInteracoes, type Interacao } from '@/lib/rxnorm'
import { CadastrarPacienteModal } from '@/components/Pacientes/CadastrarPacienteModal'
import { buscarCid, type CidEntry } from '@/data/cid10'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

// ─── banco de medicamentos ────────────────────────────────────────────────────

const MEDICAMENTOS: { nome: string; posologia: string; indicacao: string; controlado?: boolean }[] = [
  // ── Analgésicos / Anti-inflamatórios ──
  {
    nome: 'Paracetamol 500mg',
    indicacao: 'Dores leves a moderadas, febre',
    posologia: '1 comprimido de 6 em 6 horas se dor ou febre (máx. 4 comprimidos/dia). Não exceder 4g/dia.',
  },
  {
    nome: 'Paracetamol 750mg',
    indicacao: 'Dores leves a moderadas, febre',
    posologia: '1 comprimido de 6 em 6 horas se dor ou febre (máx. 4 comprimidos/dia). Não exceder 3g/dia.',
  },
  {
    nome: 'Dipirona 500mg',
    indicacao: 'Dor moderada e febre',
    posologia: '1 a 2 comprimidos de 6 em 6 horas se dor ou febre (máx. 4 doses/dia). Pode ser tomado com ou sem alimento.',
  },
  {
    nome: 'Ácido Acetilsalicílico (AAS) 500mg',
    indicacao: 'Cefaleia, odontalgia, febre',
    posologia: '1 a 2 comprimidos de 4 em 4 a 8 em 8 horas se dor. Tomar após refeições ou com leite para reduzir irritação gástrica.',
  },
  {
    nome: 'Ácido Mefenâmico 500mg',
    indicacao: 'Dor intensa, dor muscular, dor traumática odontológica',
    posologia: '1 comprimido de 8 em 8 horas. Tomar com alimento ou leite. Não usar por mais de 7 dias.',
  },
  {
    nome: 'Ibuprofeno 400mg',
    indicacao: 'Dor, febre, inflamação',
    posologia: '1 comprimido de 6 em 6 horas ou de 8 em 8 horas. Tomar sempre após refeições.',
  },
  {
    nome: 'Ibuprofeno 600mg',
    indicacao: 'Dor e inflamação moderada a intensa, pós-operatório',
    posologia: '1 comprimido de 8 em 8 horas. Tomar sempre após refeições. Não usar por mais de 5 dias sem orientação.',
  },
  {
    nome: 'Nimesulida 100mg',
    indicacao: 'Dor, febre e inflamação (urgências odontológicas)',
    posologia: '1 comprimido de 12 em 12 horas por até 3 dias. Tomar após as refeições.',
  },
  {
    nome: 'Diclofenaco Potássico 50mg',
    indicacao: 'Dor e inflamação aguda e pós-cirúrgica',
    posologia: '1 comprimido de 8 em 8 horas ou de 12 em 12 horas. Tomar com alimento para reduzir irritação gástrica.',
  },
  {
    nome: 'Naproxeno 250mg',
    indicacao: 'Estados dolorosos agudos com inflamação',
    posologia: '1 comprimido de 12 em 12 horas ou 1 vez ao dia. Tomar após refeições.',
  },
  {
    nome: 'Piroxicam 20mg',
    indicacao: 'Dor e inflamação aguda, pós-operatória e pós-traumática',
    posologia: '1 comprimido 1 vez ao dia (preferencialmente pela manhã com alimento). Uso máximo de 14 dias.',
  },
  {
    nome: 'Cetoprofeno 50mg',
    indicacao: 'Dor, inflamação, lesões traumáticas',
    posologia: '2 cápsulas de 12 em 12 horas. Tomar com alimento.',
  },
  {
    nome: 'Meloxicam 15mg',
    indicacao: 'Artrite reumatoide, osteoartrites, disfunção de ATM',
    posologia: '1 comprimido 1 vez ao dia pela manhã com alimento.',
  },
  {
    nome: 'Celecoxibe 200mg',
    indicacao: 'Dor e inflamação, menor risco gastrointestinal',
    posologia: '1 cápsula de 12 em 12 horas. Pode ser tomado com ou sem alimento.',
  },
  {
    nome: 'Etoricoxibe 90mg',
    indicacao: 'Dor aguda, pós-cirúrgico odontológico',
    posologia: '1 comprimido 1 vez ao dia. Uso máximo de 3 dias em pós-cirúrgico. Tomar com ou sem alimento.',
  },
  {
    nome: 'Etoricoxibe 60mg',
    indicacao: 'Dor crônica, artrite',
    posologia: '1 comprimido 1 vez ao dia (uso crônico sob supervisão). Tomar com ou sem alimento.',
  },
  {
    nome: 'Tenoxicam 20mg',
    indicacao: 'Dor pós-cirúrgica, artrite',
    posologia: '1 comprimido 1 vez ao dia pela manhã, com alimento.',
  },
  {
    nome: 'Etodolaco 300mg',
    indicacao: 'Dor e inflamação',
    posologia: '1 comprimido de 6 em 6 a 8 em 8 horas (máx. 1000mg/dia). Tomar com alimento.',
  },
  // ── Opioides / Controlados dor ──
  {
    nome: 'Paracetamol 500mg + Fosfato de Codeína 7,5mg',
    indicacao: 'Dor leve a moderada',
    posologia: '1 comprimido a cada 4 horas se dor (máx. 6 comprimidos/dia). Não ingerir bebidas alcoólicas.',
    controlado: true,
  },
  {
    nome: 'Paracetamol 500mg + Fosfato de Codeína 30mg',
    indicacao: 'Dor moderada a intensa — pós-operatório, pós-extração, pulpite irreversível',
    posologia: '1 comprimido a cada 4 horas se dor (máx. 6 comprimidos/dia). Não dirigir veículos. Não ingerir álcool.',
    controlado: true,
  },
  {
    nome: 'Cloridrato de Tramadol 50mg',
    indicacao: 'DTM, neuralgia do trigêmeo, dores neuropáticas, pulpites avançadas',
    posologia: '1 cápsula de 6 em 6 horas por 3 dias (máx. 400mg/dia). Não ingerir álcool. Pode causar sonolência — não dirigir.',
    controlado: true,
  },
  // ── Antidepressivos / Neuropáticos (controlados) ──
  {
    nome: 'Amitriptilina 25mg',
    indicacao: 'Dor crônica, fibromialgia, dor neuropática, DTM, cefaleia, enxaqueca, síndrome de ardência bucal',
    posologia: 'Dose inicial: ½ comprimido (12,5mg) ao deitar. Aumentar gradualmente conforme orientação médica/odontológica. Não interromper bruscamente.',
    controlado: true,
  },
  {
    nome: 'Nortriptilina 25mg',
    indicacao: 'DTM, dor neuropática crônica',
    posologia: '1 cápsula de 8 em 8 horas (25mg 3 vezes ao dia). Tomar preferencialmente à noite. Não interromper bruscamente.',
    controlado: true,
  },
  {
    nome: 'Carbamazepina 200mg',
    indicacao: 'Neuralgia do trigêmeo, neuralgia glossofaríngea, neuropatia diabética',
    posologia: 'Dose inicial: 1 comprimido 2 vezes ao dia. Aumentar gradualmente sob supervisão até controle da dor (máx. 1200mg/dia). Tomar com alimento.',
    controlado: true,
  },
  // ── Corticosteroides sistêmicos ──
  {
    nome: 'Dexametasona 4mg',
    indicacao: 'Edema pós-cirúrgico, processos inflamatórios odontológicos',
    posologia: '1 comprimido de 12 em 12 horas por 2 a 3 dias, iniciando no dia da cirurgia (pela manhã). Tomar com alimento.',
  },
  {
    nome: 'Betametasona 0,5mg',
    indicacao: 'Edema e inflamação pós-operatória',
    posologia: '1 comprimido de 12 em 12 horas por 3 dias. Tomar com alimento.',
  },
  {
    nome: 'Prednisona 20mg',
    indicacao: 'Doenças inflamatórias, autoimunes, reações alérgicas graves',
    posologia: '1 a 3 comprimidos 1 vez ao dia pela manhã (dose conforme prescrição). Tomar com alimento. Não interromper bruscamente.',
  },
  {
    nome: 'Prednisolona 20mg',
    indicacao: 'Processos inflamatórios e autoimunes orais',
    posologia: '1 a 3 comprimidos 1 vez ao dia às 8h (dose conforme prescrição). Pré-cirúrgico: 1 hora antes do procedimento por 3 a 5 dias. Tomar com alimento.',
  },
  // ── Corticosteroides tópicos bucais ──
  {
    nome: 'Triancinolona Acetonida (Omcilon-A em Orabase)',
    indicacao: 'Aftas, úlceras traumáticas orais, estomatite aftosa recorrente',
    posologia: 'Aplicar camada fina sobre a lesão com cotonete de 2 a 4 vezes ao dia, inclusive ao deitar. Não ingerir alimento imediatamente após aplicação.',
  },
  {
    nome: 'Propionato de Clobetazol 0,05% gel',
    indicacao: 'Líquen plano erosivo, pênfigo vulgar, penfigóide oral',
    posologia: 'Aplicar quantidade mínima sobre a lesão 1 a 2 vezes ao dia. Solução para bochecho: bochechar 10mL por 3 minutos e cuspir.',
  },
  {
    nome: 'Dexametasona Elixir 0,1mg/mL',
    indicacao: 'Feridas cirúrgicas, lesões maxilomandibulares, úlceras aftosas recorrentes',
    posologia: 'Bochechar 1 colher de sopa (15mL) por 2 minutos de 4 a 8 vezes ao dia e cuspir. Não engolir.',
  },
  {
    nome: 'Betametasona Elixir 0,1mg/mL',
    indicacao: 'Feridas cirúrgicas, lesões maxilomandibulares, úlceras aftosas recorrentes',
    posologia: 'Bochechar 1 colher de sopa diluído em 1 colher de água de 4 vezes ao dia e cuspir. Não engolir.',
  },
  {
    nome: 'Hidrocortisona Pomada 1%',
    indicacao: 'Inflamação e prurido em dermatoses labiais',
    posologia: 'Aplicar uma camada fina sobre a região afetada de 3 a 4 vezes ao dia.',
  },
  // ── Antibióticos ──
  {
    nome: 'Amoxicilina 500mg',
    indicacao: 'Infecções bucais bacterianas, abscessos, profilaxia antibiótica',
    posologia: '1 cápsula de 8 em 8 horas por 7 a 10 dias. Profilaxia: 2g (4 cápsulas) dose única 1 hora antes do procedimento. Tomar com ou sem alimento.',
  },
  {
    nome: 'Amoxicilina 875mg + Ácido Clavulânico 125mg',
    indicacao: 'Infecções dentárias refratárias, lesões periapicais com resistência bacteriana',
    posologia: '1 comprimido de 8 em 8 horas por 7 dias. Tomar com alimento para reduzir desconforto gástrico.',
  },
  {
    nome: 'Azitromicina 500mg',
    indicacao: 'Abscessos periapicais em pacientes alérgicos à penicilina',
    posologia: '1 comprimido 1 vez ao dia por 3 dias. Pode ser tomado com ou sem alimento.',
  },
  {
    nome: 'Cefalexina 500mg',
    indicacao: 'Infecções dentárias bacterianas, profilaxia antibiótica',
    posologia: '1 cápsula de 6 em 6 horas por 7 a 10 dias. Profilaxia: 2g (4 cápsulas) dose única 1 hora antes do procedimento. Tomar com alimento.',
  },
  {
    nome: 'Clindamicina 300mg',
    indicacao: 'Infecções dentárias incluindo abscessos, periodontite (alternativo para alérgicos à penicilina)',
    posologia: '1 cápsula de 8 em 8 horas ou de 12 em 12 horas por 7 a 10 dias. Tomar com copo cheio de água e permanecer em posição ereta por 30 min após.',
  },
  {
    nome: 'Metronidazol 250mg',
    indicacao: 'Infecções bacterianas bucais anaeróbicas, periodontite',
    posologia: '1 comprimido de 8 em 8 horas por 7 a 10 dias. NÃO ingerir bebidas alcoólicas durante e por 48 horas após o tratamento.',
  },
  {
    nome: 'Metronidazol 400mg',
    indicacao: 'Infecções bacterianas bucais anaeróbicas, periodontite',
    posologia: '1 comprimido de 8 em 8 horas por 7 a 10 dias. NÃO ingerir bebidas alcoólicas durante e por 48 horas após o tratamento.',
  },
  {
    nome: 'Tetraciclina 500mg',
    indicacao: 'Gengivoestomatite por Fusobacterium, periodontite refratária',
    posologia: '1 comprimido de 6 em 6 horas ou de 12 em 12 horas por 7 a 10 dias. Tomar com copo cheio de água. NÃO ingerir laticínios, antiácidos ou ferro 1 a 2 horas antes ou após a dose.',
  },
  // ── Antivirais ──
  {
    nome: 'Aciclovir 200mg',
    indicacao: 'Herpes simplex oral (tratamento de episódios agudos)',
    posologia: '1 comprimido a cada 4 horas, 5 vezes ao dia (intervalos de vigília) por 5 dias. Iniciar ao primeiro sinal (formigamento, coceira). Beber bastante água.',
  },
  {
    nome: 'Aciclovir Creme 50mg/g (5%)',
    indicacao: 'Herpes labial (uso tópico)',
    posologia: 'Aplicar sobre a lesão 5 vezes ao dia (a cada 4 horas) por 4 dias. Iniciar ao primeiro sinal do surto. Não aplicar no interior da boca ou nos olhos.',
  },
  {
    nome: 'Valaciclovir 500mg',
    indicacao: 'Herpes zoster, herpes simplex recorrente',
    posologia: 'Herpes zoster: 2 comprimidos (1000mg) 3 vezes ao dia por 7 dias. Herpes simples: 1 comprimido 2 vezes ao dia por 3 a 5 dias. Beber bastante água.',
  },
  {
    nome: 'Fanciclovir 500mg',
    indicacao: 'Herpes zoster agudo, herpes simplex mucocutâneo',
    posologia: '1 comprimido de 8 em 8 horas por 7 dias. Tomar com ou sem alimento.',
  },
  {
    nome: 'Penciclovir Creme 1%',
    indicacao: 'Herpes labial recorrente (uso tópico)',
    posologia: 'Aplicar sobre a lesão a cada 2 horas durante as horas de vigília por 4 dias. Iniciar ao primeiro sinal do surto.',
  },
  // ── Antifúngicos ──
  {
    nome: 'Nistatina Suspensão Oral 100.000UI/mL',
    indicacao: 'Candidose oral (sapinho), candidíase do trato digestivo superior',
    posologia: 'Adultos: 1 a 6mL, bochechar e engolir 4 vezes ao dia. Manter o líquido na boca o maior tempo possível antes de engolir. Continuar por pelo menos 2 dias após o desaparecimento dos sintomas.',
  },
  {
    nome: 'Miconazol Gel Oral 20mg/g (Daktarin®)',
    indicacao: 'Candidose orofaríngea, estomatite por Candida',
    posologia: '½ colher de chá 4 vezes ao dia após as refeições e ao deitar. Aplicar sobre as lesões e manter na boca o maior tempo possível. Continuar por 1 semana após resolução dos sintomas.',
  },
  {
    nome: 'Fluconazol 150mg',
    indicacao: 'Candidose mucocutânea, candidíase oral em pacientes imunocomprometidos',
    posologia: '1 cápsula 1 vez ao dia por 7 a 14 dias. Tomar com ou sem alimento.',
  },
  {
    nome: 'Itraconazol 100mg',
    indicacao: 'Candidose oral, blastomicose, histoplasmose',
    posologia: '1 cápsula 1 vez ao dia por 15 dias. Tomar logo após refeição principal para melhor absorção.',
  },
  {
    nome: 'Cetoconazol 200mg',
    indicacao: 'Candidose mucocutânea crônica',
    posologia: '1 comprimido 1 vez ao dia ou 2 comprimidos 1 vez ao dia até resolução (máx. 4 semanas). Tomar com alimento.',
  },
  // ── Antissépticos bucais ──
  {
    nome: 'Digluconato de Clorexidina 0,12% (solução)',
    indicacao: 'Controle de placa e biofilme, antissepsia pré-operatória, coadjuvante no tratamento periodontal',
    posologia: 'Bochechar 15mL por 1 minuto, 2 vezes ao dia (manhã e noite) após escovação. Não enxaguar com água após o bochecho. Não ingerir.',
  },
  {
    nome: 'Peróxido de Hidrogênio 3% (Água Oxigenada)',
    indicacao: 'Limpeza e desinfecção de feridas bucais',
    posologia: 'Gargarejar ou bochechar solução diluída (1 parte água oxigenada + 1 parte água) por 30 segundos, 2 a 3 vezes ao dia. Não engolir.',
  },
  // ── Benzodiazepínicos pré-anestésicos (controlados) ──
  {
    nome: 'Diazepam 5mg',
    indicacao: 'Ansiedade, sedação mínima pré-procedimento odontológico',
    posologia: '1 a 2 comprimidos (5 a 10mg) 1 HORA antes do procedimento (dose única). Não dirigir veículos. Acompanhar com responsável.',
    controlado: true,
  },
  {
    nome: 'Diazepam 10mg',
    indicacao: 'Ansiedade intensa, sedação pré-procedimento odontológico',
    posologia: '1 comprimido (10mg) 1 HORA antes do procedimento (dose única). Não dirigir veículos. Acompanhar com responsável.',
    controlado: true,
  },
  {
    nome: 'Lorazepam 2mg',
    indicacao: 'Ansiedade, sedação pré-procedimento (mais seguro em idosos)',
    posologia: '1 comprimido (2mg) 2 HORAS antes do procedimento (dose única). Efeito dura 2 a 3 horas. Não dirigir veículos. Acompanhar com responsável.',
    controlado: true,
  },
  {
    nome: 'Alprazolam 1mg',
    indicacao: 'Sedação mínima pré-procedimento odontológico',
    posologia: '½ a 1 comprimido (0,5 a 1mg) 45 a 60 MINUTOS antes do procedimento (dose única). Não dirigir veículos. Acompanhar com responsável.',
    controlado: true,
  },
  {
    nome: 'Midazolam 7,5mg',
    indicacao: 'Sedação pré-procedimento odontológico',
    posologia: '1 comprimido (7,5mg) 30 MINUTOS antes do procedimento (dose única). Não dirigir veículos. Acompanhar com responsável.',
    controlado: true,
  },
  {
    nome: 'Midazolam 15mg',
    indicacao: 'Sedação pré-procedimento odontológico (dose maior)',
    posologia: '1 comprimido (15mg) 30 MINUTOS antes do procedimento (dose única). Não dirigir veículos. Acompanhar com responsável.',
    controlado: true,
  },
  // ── Hipossalivação ──
  {
    nome: 'Cloridrato de Pilocarpina 5mg',
    indicacao: 'Xerostomia (boca seca) — radioterapia de cabeça e pescoço, Síndrome de Sjögren',
    posologia: '1 a 2 comprimidos (5 a 10mg) 3 vezes ao dia, 30 minutos antes das refeições. Tomar com água.',
  },
  {
    nome: 'Saliva Artificial Spray (base de xilitol)',
    indicacao: 'Alívio sintomático da boca seca (xerostomia)',
    posologia: 'Aplicar 2 a 3 jatos na boca ao longo do dia sempre que sentir ressecamento, especialmente antes das refeições e ao deitar.',
  },
  // ── Controle de sangramento ──
  {
    nome: 'Ácido Tranexâmico 250mg',
    indicacao: 'Prevenção e controle de sangramento pós-cirúrgico, hemofilia (pré e pós-extração)',
    posologia: '1 a 2 comprimidos de 8 em 8 horas por 3 a 4 dias após o procedimento. Tomar com água. Pacientes com hemofilia: iniciar 2 horas antes da extração.',
  },
]

// ─── mapeamento para RxNorm (nomes genéricos em inglês) ──────────────────────

const RXNORM_NOMES: Record<string, string> = {
  // Analgésicos
  'Paracetamol 500mg':                                 'acetaminophen',
  'Paracetamol 750mg':                                 'acetaminophen',
  'Dipirona 500mg':                                    'dipyrone',
  'Ácido Acetilsalicílico (AAS) 500mg':                'aspirin',
  'Ácido Mefenâmico 500mg':                            'mefenamic acid',
  'Ibuprofeno 400mg':                                  'ibuprofen',
  'Ibuprofeno 600mg':                                  'ibuprofen',
  'Nimesulida 100mg':                                  'nimesulide',
  'Diclofenaco Potássico 50mg':                        'diclofenac',
  'Naproxeno 250mg':                                   'naproxen',
  'Piroxicam 20mg':                                    'piroxicam',
  'Cetoprofeno 50mg':                                  'ketoprofen',
  'Meloxicam 15mg':                                    'meloxicam',
  'Celecoxibe 200mg':                                  'celecoxib',
  'Etoricoxibe 90mg':                                  'etoricoxib',
  'Etoricoxibe 60mg':                                  'etoricoxib',
  'Tenoxicam 20mg':                                    'tenoxicam',
  'Etodolaco 300mg':                                   'etodolac',
  // Opioides
  'Paracetamol 500mg + Fosfato de Codeína 7,5mg':      'codeine',
  'Paracetamol 500mg + Fosfato de Codeína 30mg':       'codeine',
  'Cloridrato de Tramadol 50mg':                       'tramadol',
  // Antidepressivos / Neurológicos
  'Amitriptilina 25mg':                                'amitriptyline',
  'Nortriptilina 25mg':                                'nortriptyline',
  'Carbamazepina 200mg':                               'carbamazepine',
  // Corticosteroides
  'Dexametasona 4mg':                                  'dexamethasone',
  'Dexametasona Elixir 0,1mg/mL':                      'dexamethasone',
  'Betametasona 0,5mg':                                'betamethasone',
  'Betametasona Elixir 0,1mg/mL':                      'betamethasone',
  'Prednisona 20mg':                                   'prednisone',
  'Prednisolona 20mg':                                 'prednisolone',
  // Antibióticos
  'Amoxicilina 500mg':                                 'amoxicillin',
  'Amoxicilina 875mg + Ácido Clavulânico 125mg':       'amoxicillin clavulanate',
  'Azitromicina 500mg':                                'azithromycin',
  'Cefalexina 500mg':                                  'cephalexin',
  'Clindamicina 300mg':                                'clindamycin',
  'Metronidazol 250mg':                                'metronidazole',
  'Metronidazol 400mg':                                'metronidazole',
  'Tetraciclina 500mg':                                'tetracycline',
  // Antivirais
  'Aciclovir 200mg':                                   'acyclovir',
  'Valaciclovir 500mg':                                'valacyclovir',
  'Fanciclovir 500mg':                                 'famciclovir',
  // Antifúngicos
  'Fluconazol 150mg':                                  'fluconazole',
  'Itraconazol 100mg':                                 'itraconazole',
  'Cetoconazol 200mg':                                 'ketoconazole',
  // Benzodiazepínicos
  'Diazepam 5mg':                                      'diazepam',
  'Diazepam 10mg':                                     'diazepam',
  'Lorazepam 2mg':                                     'lorazepam',
  'Alprazolam 1mg':                                    'alprazolam',
  'Midazolam 7,5mg':                                   'midazolam',
  'Midazolam 15mg':                                    'midazolam',
  // Outros sistêmicos
  'Cloridrato de Pilocarpina 5mg':                     'pilocarpine',
  'Ácido Tranexâmico 250mg':                           'tranexamic acid',
}

// ─── banco de exames por categoria ───────────────────────────────────────────

const CATEGORIAS_EXAME = [
  {
    nome: 'Radiografia',
    exames: [
      { nome: 'Radiografia periapical',                desc: 'Região: ___' },
      { nome: 'Radiografia interproximal (bite-wing)', desc: 'Lados: direito / esquerdo' },
      { nome: 'Radiografia panorâmica',                desc: '' },
      { nome: 'Telerradiografia de perfil',            desc: '' },
      { nome: 'Radiografia oclusal',                   desc: 'Região: ___' },
    ],
  },
  {
    nome: 'Tomografia',
    exames: [
      { nome: 'Tomografia computadorizada (CBCT) – parcial', desc: 'Região: ___' },
      { nome: 'Tomografia computadorizada (CBCT) – total',   desc: '' },
      { nome: 'Tomografia de ATM bilateral',                 desc: '' },
    ],
  },
  {
    nome: 'Oclusão / ATM',
    exames: [
      { nome: 'Análise de modelos de estudo',   desc: '' },
      { nome: 'Registro de mordida',            desc: '' },
      { nome: 'Montagem em articulador',        desc: '' },
      { nome: 'Eletromiongrafia (EMG)',          desc: '' },
      { nome: 'Ressonância magnética de ATM',   desc: 'Bilateral / unilateral: ___' },
    ],
  },
  {
    nome: 'Biópsia / Patologia',
    exames: [
      { nome: 'Biópsia incisional',             desc: 'Região / lesão: ___' },
      { nome: 'Biópsia excisional',             desc: 'Região / lesão: ___' },
      { nome: 'Citologia esfoliativa',          desc: 'Região: ___' },
      { nome: 'Imuno-histoquímica',             desc: '' },
      { nome: 'Cultura microbiológica',         desc: 'Material: ___' },
      { nome: 'Antibiograma',                   desc: '' },
    ],
  },
  {
    nome: 'Laboratorial',
    exames: [
      { nome: 'Hemograma completo',              desc: '' },
      { nome: 'Coagulograma (TP, TTPA)',         desc: '' },
      { nome: 'Glicemia em jejum',               desc: '' },
      { nome: 'Hemoglobina glicada (HbA1c)',     desc: '' },
      { nome: 'Proteína C-reativa (PCR)',        desc: '' },
      { nome: 'VHS',                             desc: '' },
      { nome: 'Sorologia HIV',                   desc: '' },
      { nome: 'Hepatite B (HBsAg)',              desc: '' },
      { nome: 'Hepatite C (Anti-HCV)',           desc: '' },
      { nome: 'Cultura e antibiograma',          desc: 'Material: ___' },
    ],
  },
]

// ─── busca de paciente ────────────────────────────────────────────────────────

interface PacienteBusca {
  id: string; nome: string; telefone: string | null
  endereco: string | null; cpf: string | null; data_nascimento: string | null
}

function BuscaPacienteInput({ value, onSelect, onCadastrar }: {
  value: PacienteBusca | null
  onSelect: (p: PacienteBusca | null) => void
  onCadastrar?: (nome: string) => void
}) {
  const [query, setQuery] = useState(value?.nome ?? '')
  const [lista, setLista] = useState<PacienteBusca[]>([])
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function buscar(q: string) {
    setQuery(q)
    onSelect(null)
    if (q.length < 2) { setLista([]); setAberto(false); return }
    const { data } = await supabase
      .from('pacientes')
      .select('id, nome, telefone, endereco, cpf, data_nascimento')
      .ilike('nome', `%${q}%`)
      .eq('status', 'Ativo')
      .limit(8)
    setLista((data as PacienteBusca[]) ?? [])
    setAberto(true)
  }

  function selecionar(p: PacienteBusca) {
    setQuery(p.nome)
    onSelect(p)
    setAberto(false)
    setLista([])
  }

  const semResultado = aberto && lista.length === 0 && query.length >= 2

  return (
    <div ref={ref} className="relative">
      <input
        className="input w-full"
        autoFocus
        placeholder="Digite o nome do paciente..."
        value={query}
        onChange={e => buscar(e.target.value)}
        onFocus={() => query.length >= 2 && lista.length > 0 && setAberto(true)}
      />
      {value && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
          <span className="font-medium">✓ {value.nome}</span>
          {value.telefone && <span className="text-green-500">· {value.telefone}</span>}
          <button type="button" onClick={() => { onSelect(null); setQuery('') }}
            className="ml-auto text-green-400 hover:text-red-500">×</button>
        </div>
      )}
      {aberto && lista.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          {lista.map(p => (
            <button key={p.id} type="button" onMouseDown={() => selecionar(p)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
              <p className="font-medium text-gray-800">{p.nome}</p>
              <p className="text-xs text-gray-400">{p.telefone ?? '—'}{p.cpf ? ` · CPF: ${p.cpf}` : ''}</p>
            </button>
          ))}
        </div>
      )}
      {semResultado && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 text-sm text-gray-400 border-b border-gray-50">
            Nenhum paciente encontrado para <span className="font-medium text-gray-600">"{query}"</span>
          </div>
          {onCadastrar && (
            <button
              type="button"
              onMouseDown={() => { setAberto(false); onCadastrar(query) }}
              className="w-full text-left px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2"
            >
              <Plus size={14} className="shrink-0" />
              Cadastrar "{query}" como novo paciente
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── tipos ────────────────────────────────────────────────────────────────────

type TipoDoc = 'receituario' | 'receituario_especial' | 'atestado' | 'pedido_exame' | 'tratamentos_realizados'

const TIPOS: { id: TipoDoc; label: string; desc: string; cor: string }[] = [
  { id: 'receituario',            label: 'Receituário simples',    desc: 'Medicamentos e posologia',            cor: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'receituario_especial',   label: 'Receituário especial',   desc: 'Medicamentos controlados (2 vias)',   cor: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'atestado',               label: 'Atestado',               desc: 'Comparecimento ou incapacidade',      cor: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'pedido_exame',           label: 'Pedido de exame',        desc: 'Raio-X, tomografia, laboratorial',    cor: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'tratamentos_realizados', label: 'Tratamentos realizados', desc: 'Exame clínico e achados bucais',      cor: 'bg-teal-50 border-teal-200 text-teal-700' },
]

interface Medicamento { nome: string; posologia: string; indicacao?: string }
interface ExameSelecionado { nome: string; desc: string }
interface DocRow { id: string; tipo: TipoDoc; paciente_nome: string | null; numero_documento: string | null; conteudo_texto: string | null; created_at: string }

function badgeColor(tipo: TipoDoc) {
  switch (tipo) {
    case 'receituario':            return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'receituario_especial':   return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'atestado':               return 'bg-green-50 text-green-700 border-green-200'
    case 'pedido_exame':           return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'tratamentos_realizados': return 'bg-teal-50 text-teal-700 border-teal-200'
  }
}

function tipoLabel(tipo: TipoDoc) { return TIPOS.find(t => t.id === tipo)?.label ?? tipo }
function gerarNumero(tipo: TipoDoc) {
  const p = { receituario: 'RS', receituario_especial: 'RE', atestado: 'AT', pedido_exame: 'PE', tratamentos_realizados: 'TR' }[tipo]
  return `${p}-${Date.now().toString().slice(-6)}`
}

// ─── tipos ANVISA ─────────────────────────────────────────────────────────────

interface AnvisaProduto {
  numeroRegistro?: string
  nomeComercial?: string
  principioAtivo?: string
  laboratorio?: string
  situacaoRegistro?: string
  classeTerapeutica?: string
  concentracao?: string
  formaFarmaceutica?: string
}

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function nomeAnvisa(p: AnvisaProduto): string {
  const partes = [p.principioAtivo, p.concentracao, p.formaFarmaceutica]
    .filter(Boolean)
    .map(v => toTitleCase(v!))
  return partes.join(' ')
}

// ─── tipo bula ────────────────────────────────────────────────────────────────

interface BulaItem {
  expediente: string
  nome: string
  principioAtivo: string
  laboratorio: string
  tipoBula: string
  urlPdf: string
}

// ─── autocomplete de medicamento ──────────────────────────────────────────────

function MedicamentoInput({ index, med, controlado, onChange, onRemove, showRemove }: {
  index: number; med: Medicamento; controlado?: boolean
  onChange: (m: Medicamento) => void; onRemove: () => void; showRemove: boolean
}) {
  const [query,        setQuery]        = useState(med.nome)
  const [open,         setOpen]         = useState(false)
  const [anvisaLista,  setAnvisaLista]  = useState<AnvisaProduto[]>([])
  const [anvisaLoad,   setAnvisaLoad]   = useState(false)
  const [bulaAberta,   setBulaAberta]   = useState(false)
  const [bulaLista,    setBulaLista]    = useState<BulaItem[]>([])
  const [bulaLoad,     setBulaLoad]     = useState(false)
  const ref      = useRef<HTMLDivElement>(null)
  const bulaRef  = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filtrados = MEDICAMENTOS.filter(m =>
    (!controlado || m.controlado) &&
    (controlado || !m.controlado) &&
    m.nome.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6)

  // busca ANVISA quando não há resultado local e query tem 3+ chars
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!open || query.length < 3 || filtrados.length >= 3) {
      setAnvisaLista([])
      return
    }
    timerRef.current = setTimeout(async () => {
      setAnvisaLoad(true)
      try {
        const r = await fetch(`/api/anvisa?nome=${encodeURIComponent(query)}`)
        const d = await r.json()
        setAnvisaLista((d.content ?? []).slice(0, 8))
      } catch {
        setAnvisaLista([])
      } finally {
        setAnvisaLoad(false)
      }
    }, 700)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, open, filtrados.length])

  function select(m: typeof MEDICAMENTOS[0]) {
    setQuery(m.nome)
    onChange({ nome: m.nome, posologia: m.posologia, indicacao: m.indicacao })
    setOpen(false)
    setAnvisaLista([])
  }

  function selectAnvisa(p: AnvisaProduto) {
    const nome = nomeAnvisa(p)
    const indicacao = p.classeTerapeutica ? toTitleCase(p.classeTerapeutica) : undefined
    setQuery(nome)
    onChange({ nome, posologia: '', indicacao })
    setOpen(false)
    setAnvisaLista([])
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setAnvisaLista([])
      }
      if (bulaRef.current && !bulaRef.current.contains(e.target as Node)) {
        setBulaAberta(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function abrirBula() {
    if (bulaAberta) { setBulaAberta(false); return }
    setBulaAberta(true)
    if (bulaLista.length > 0) return
    setBulaLoad(true)
    try {
      const nomeBusca = med.nome.split(' ').slice(0, 2).join(' ')
      const r = await fetch(`/api/bula?nome=${encodeURIComponent(nomeBusca)}`)
      const d = await r.json()
      setBulaLista(d.content ?? [])
    } catch {
      setBulaLista([])
    } finally {
      setBulaLoad(false)
    }
  }

  const showDropdown = open && (filtrados.length > 0 || anvisaLista.length > 0 || anvisaLoad)

  return (
    <div className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{index + 1}.</span>
        <div ref={ref} className="flex-1 relative">
          <input
            className="input w-full text-sm"
            placeholder="Buscar medicamento..."
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              onChange({ nome: e.target.value, posologia: med.posologia, indicacao: med.indicacao })
              setOpen(true)
              setBulaLista([])
              setBulaAberta(false)
            }}
            onFocus={() => setOpen(true)}
          />
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto">
              {/* resultados locais */}
              {filtrados.length > 0 && (
                <>
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Banco local</span>
                  </div>
                  {filtrados.map(m => (
                    <button key={m.nome} type="button" onMouseDown={() => select(m)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
                      <p className="font-medium text-gray-800">{m.nome}</p>
                      {m.indicacao && <p className="text-xs text-blue-500 truncate">↪ {m.indicacao}</p>}
                      <p className="text-xs text-gray-400 truncate mt-0.5">{m.posologia}</p>
                    </button>
                  ))}
                </>
              )}

              {/* resultados ANVISA */}
              {(anvisaLoad || anvisaLista.length > 0) && (
                <>
                  <div className="px-3 py-1.5 bg-green-50 border-b border-green-100 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">ANVISA</span>
                    {anvisaLoad && <Loader2 size={10} className="animate-spin text-green-500" />}
                  </div>
                  {anvisaLista.map((p, i) => {
                    const nome = nomeAnvisa(p)
                    const valido = p.situacaoRegistro?.toLowerCase().includes('válido')
                    return (
                      <button key={i} type="button" onMouseDown={() => selectAnvisa(p)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-green-50 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 flex-1">{nome || p.nomeComercial}</p>
                          {valido !== undefined && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${valido ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {valido ? 'Válido' : 'Vencido'}
                            </span>
                          )}
                        </div>
                        {p.nomeComercial && nome !== p.nomeComercial && (
                          <p className="text-xs text-gray-400 truncate">{toTitleCase(p.nomeComercial)}</p>
                        )}
                        {p.classeTerapeutica && (
                          <p className="text-xs text-green-600 truncate">↪ {toTitleCase(p.classeTerapeutica)}</p>
                        )}
                        {p.laboratorio && (
                          <p className="text-[10px] text-gray-300 truncate mt-0.5">{toTitleCase(p.laboratorio)}</p>
                        )}
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </div>
        {showRemove && (
          <button type="button" onClick={onRemove} className="p-1 text-gray-300 hover:text-red-500 rounded shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {/* indicação + botão bula */}
      <div className="ml-7 flex items-start gap-2">
        {med.indicacao && (
          <div className="flex-1 flex items-start gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
            <span className="font-semibold shrink-0">Indicação:</span>
            <span>{med.indicacao}</span>
          </div>
        )}
        {med.nome.length >= 3 && (
          <div ref={bulaRef} className="relative shrink-0">
            <button
              type="button"
              onClick={abrirBula}
              className={clsx(
                'flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors',
                bulaAberta
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
              )}
            >
              {bulaLoad ? <Loader2 size={11} className="animate-spin" /> : <BookOpen size={11} />}
              Bula
            </button>

            {bulaAberta && (
              <div className="absolute right-0 top-full mt-1 z-30 w-80 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
                  <BookOpen size={12} className="text-indigo-600" />
                  <span className="text-xs font-semibold text-indigo-700">Bulas ANVISA — {med.nome.split(' ').slice(0,2).join(' ')}</span>
                </div>

                {bulaLoad && (
                  <div className="flex items-center gap-2 px-3 py-4 text-xs text-gray-400">
                    <Loader2 size={12} className="animate-spin" /> Buscando bulas...
                  </div>
                )}

                {!bulaLoad && bulaLista.length === 0 && (
                  <p className="px-3 py-4 text-xs text-gray-400 text-center">
                    Nenhuma bula encontrada na ANVISA para este medicamento.
                  </p>
                )}

                {!bulaLoad && bulaLista.length > 0 && (
                  <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                    {bulaLista.map((b, i) => (
                      <a
                        key={i}
                        href={b.urlPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-indigo-50 transition-colors group"
                      >
                        <FileText size={14} className="text-indigo-400 shrink-0 mt-0.5 group-hover:text-indigo-600" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={clsx(
                              'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                              b.tipoBula === 'PROFISSIONAL'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-600'
                            )}>
                              {b.tipoBula === 'PROFISSIONAL' ? 'Profissional' : 'Paciente'}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-gray-700 truncate group-hover:text-indigo-700">
                            {toTitleCase(b.nome || b.principioAtivo)}
                          </p>
                          {b.laboratorio && (
                            <p className="text-[10px] text-gray-400 truncate">{toTitleCase(b.laboratorio)}</p>
                          )}
                        </div>
                        <ExternalLink size={11} className="text-gray-300 shrink-0 mt-1 group-hover:text-indigo-500" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <textarea
        className="input w-full text-sm resize-none ml-7"
        rows={2}
        placeholder="Posologia: dose, frequência e duração..."
        value={med.posologia}
        onChange={e => onChange({ nome: med.nome, posologia: e.target.value, indicacao: med.indicacao })}
      />
    </div>
  )
}

// ─── formulário receituário ───────────────────────────────────────────────────

function ReceituarioForm({ especial, onChange }: { especial?: boolean; onChange: (d: object) => void }) {
  const [meds,       setMeds]       = useState<Medicamento[]>([{ nome: '', posologia: '' }])
  const [obs,        setObs]        = useState('')
  const [notif,      setNotif]      = useState('')
  const [interacoes, setInteracoes] = useState<Interacao[]>([])
  const [checking,   setChecking]   = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function update(m = meds, o = obs, n = notif) {
    onChange({ medicamentos: m, observacoes: o, ...(especial ? { numero_notificacao: n } : {}) })
  }

  function setMed(i: number, val: Medicamento) { const next = meds.map((m, idx) => idx === i ? val : m); setMeds(next); update(next) }
  function addMed() { const next = [...meds, { nome: '', posologia: '' }]; setMeds(next); update(next) }
  function removeMed(i: number) { const next = meds.filter((_, idx) => idx !== i); setMeds(next); update(next) }

  const checarInteracoes = useCallback(async (lista: Medicamento[]) => {
    const nomesComRxNorm = lista.map(m => RXNORM_NOMES[m.nome]).filter(Boolean) as string[]
    if (nomesComRxNorm.length < 2) { setInteracoes([]); return }

    setChecking(true)
    const rxcuis = (await Promise.all(nomesComRxNorm.map(getRxCUI))).filter(Boolean) as string[]
    const unicos = rxcuis.filter((v, i, a) => a.indexOf(v) === i)
    const resultado = unicos.length >= 2 ? await verificarInteracoes(unicos) : []
    setInteracoes(resultado)
    setChecking(false)
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => checarInteracoes(meds), 900)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [meds, checarInteracoes])

  return (
    <div className="space-y-4">
      {especial && (
        <div>
          <label className="label">Nº de notificação</label>
          <input className="input" placeholder="Número da notificação de receita especial" value={notif}
            onChange={e => { setNotif(e.target.value); update(meds, obs, e.target.value) }} />
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Medicamentos</label>
          <button type="button" onClick={addMed} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Plus size={12} /> Adicionar medicamento
          </button>
        </div>
        <div className="space-y-2">
          {meds.map((m, i) => (
            <MedicamentoInput key={i} index={i} med={m} controlado={especial}
              onChange={val => setMed(i, val)} onRemove={() => removeMed(i)} showRemove={meds.length > 1} />
          ))}
        </div>
      </div>

      {/* Painel de interações */}
      {checking && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
          <Loader2 size={13} className="animate-spin" />
          Verificando interações medicamentosas...
        </div>
      )}
      {!checking && interacoes.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 border-b border-amber-200">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-700">
              {interacoes.length} interação{interacoes.length > 1 ? 'ões' : ''} detectada{interacoes.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-amber-100">
            {interacoes.map((it, i) => {
              const cor = it.severidade === 'high'
                ? { bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', icon: <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5" />, label: 'Grave' }
                : it.severidade === 'moderate'
                ? { bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', icon: <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />, label: 'Moderada' }
                : { bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700', icon: <Info size={12} className="text-blue-400 shrink-0 mt-0.5" />, label: 'Leve' }
              return (
                <div key={i} className={`px-3 py-2.5 ${cor.bg}`}>
                  <div className="flex items-start gap-2">
                    {cor.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cor.badge}`}>{cor.label}</span>
                        {it.farmacos.filter(Boolean).map(f => (
                          <span key={f} className="text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded px-1.5 py-0.5 capitalize">{f}</span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{it.descricao}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {!checking && interacoes.length === 0 && meds.filter(m => RXNORM_NOMES[m.nome]).length >= 2 && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2 border border-green-100">
          <Check size={13} className="shrink-0" />
          Nenhuma interação conhecida entre os medicamentos selecionados.
        </div>
      )}

      <div>
        <label className="label">Observações (opcional)</label>
        <textarea className="input w-full resize-none text-sm" rows={2}
          placeholder="Ex: Tomar com alimento. Não interromper o tratamento." value={obs}
          onChange={e => { setObs(e.target.value); update(meds, e.target.value) }} />
      </div>
    </div>
  )
}

// ─── formulário atestado ──────────────────────────────────────────────────────

// ─── autocomplete CID-10 ──────────────────────────────────────────────────────

function CidInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query,    setQuery]    = useState(value)
  const [open,     setOpen]     = useState(false)
  const [lista,    setLista]    = useState<CidEntry[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(v: string) {
    setQuery(v)
    onChange(v)
    setLista(buscarCid(v))
    setOpen(true)
  }

  function select(c: CidEntry) {
    const full = `${c.codigo} — ${c.descricao}`
    setQuery(full)
    onChange(full)
    setOpen(false)
    setLista([])
  }

  return (
    <div ref={ref} className="relative">
      <input
        className="input w-full"
        placeholder="Ex: K04.0 — Pulpite"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => lista.length > 0 && setOpen(true)}
      />
      {open && lista.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {lista.map(c => (
            <button key={c.codigo} type="button" onMouseDown={() => select(c)}
              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0">
              <span className="text-xs font-bold text-blue-600 mr-2">{c.codigo}</span>
              <span className="text-sm text-gray-700">{c.descricao}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── formulário atestado ──────────────────────────────────────────────────────

function AtestadoForm({ onChange }: { onChange: (d: object) => void }) {
  const [tipoAt,     setTipoAt]     = useState<'comparecimento' | 'incapacidade'>('comparecimento')
  const [data,       setData]       = useState(format(new Date(), 'yyyy-MM-dd'))
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim,    setHoraFim]    = useState('')
  const [duracao,    setDuracao]    = useState('')
  const [cid,        setCid]        = useState('')
  const [obs,        setObs]        = useState('')
  const [procedimento, setProcedimento] = useState('')

  function update(
    t = tipoAt, d = data, hi = horaInicio, hf = horaFim,
    dur = duracao, c = cid, o = obs, proc = procedimento
  ) {
    onChange({ tipo: t, data_consulta: d, hora_inicio: hi, hora_fim: hf, duracao: dur, cid: c, observacoes: o, procedimento: proc })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Tipo de atestado</label>
        <div className="flex gap-2">
          {(['comparecimento', 'incapacidade'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setTipoAt(t); update(t) }}
              className={clsx('flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-colors',
                tipoAt === t ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
              {t === 'comparecimento' ? 'Comparecimento' : 'Afastamento'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Data da consulta</label>
        <input type="date" className="input" value={data}
          onChange={e => { setData(e.target.value); update(tipoAt, e.target.value) }} />
      </div>

      {tipoAt === 'comparecimento' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Hora de entrada</label>
            <input type="time" className="input" value={horaInicio}
              onChange={e => { setHoraInicio(e.target.value); update(tipoAt, data, e.target.value) }} />
          </div>
          <div>
            <label className="label">Hora de saída</label>
            <input type="time" className="input" value={horaFim}
              onChange={e => { setHoraFim(e.target.value); update(tipoAt, data, horaInicio, e.target.value) }} />
          </div>
        </div>
      )}

      {tipoAt === 'incapacidade' && (
        <div>
          <label className="label">Dias de afastamento</label>
          <input className="input" placeholder="Ex: 2 (dois) dias" value={duracao}
            onChange={e => { setDuracao(e.target.value); update(tipoAt, data, horaInicio, horaFim, e.target.value) }} />
        </div>
      )}

      <div>
        <label className="label">Procedimento realizado (opcional)</label>
        <input className="input" placeholder="Ex: Exodontia, tratamento de canal, restauração..." value={procedimento}
          onChange={e => { setProcedimento(e.target.value); update(tipoAt, data, horaInicio, horaFim, duracao, cid, obs, e.target.value) }} />
      </div>

      <div>
        <label className="label">CID-10 (opcional)</label>
        <CidInput value={cid} onChange={v => { setCid(v); update(tipoAt, data, horaInicio, horaFim, duracao, v) }} />
      </div>

      <div>
        <label className="label">Observações (opcional)</label>
        <textarea className="input w-full resize-none text-sm" rows={2} value={obs}
          onChange={e => { setObs(e.target.value); update(tipoAt, data, horaInicio, horaFim, duracao, cid, e.target.value) }} />
      </div>
    </div>
  )
}

// ─── formulário tratamentos realizados (exame físico e clínico) ──────────────

interface ExameFisico {
  face: string; atm: string; linfonodos: string; labios: string; mucosa_labial: string
  mucosa_oral: string; lingua: string; assoalho: string; palato: string; gengiva: string
  classe_angle: string; overjet: string; overbite: string; dtm_sinais: string; parafuncoes: string
  lesoes_carie: string; fraturas: string; lesoes_mucosa: string; outras_patologias: string
}

const EMPTY_EXAME_FISICO: ExameFisico = {
  face: '', atm: '', linfonodos: '', labios: '', mucosa_labial: '',
  mucosa_oral: '', lingua: '', assoalho: '', palato: '', gengiva: '',
  classe_angle: '', overjet: '', overbite: '', dtm_sinais: '', parafuncoes: '',
  lesoes_carie: '', fraturas: '', lesoes_mucosa: '', outras_patologias: '',
}

const SECOES_TRATAMENTO = ['Extrabucal', 'Intrabucal', 'Oclusão / DTM', 'Patologias']

function ExameFisicoField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0 pt-1.5 leading-tight">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Sem alterações'}
        className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

function TratamentosForm({ onChange }: { onChange: (d: object) => void }) {
  const [secao, setSecao] = useState(0)
  const [fisico, setFisico] = useState<ExameFisico>(EMPTY_EXAME_FISICO)

  function setF<K extends keyof ExameFisico>(key: K, val: string) {
    const next = { ...fisico, [key]: val }
    setFisico(next)
    onChange({ exame_fisico: next })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {SECOES_TRATAMENTO.map((s, i) => (
          <button key={s} type="button" onClick={() => setSecao(i)}
            className={clsx(
              'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap border transition-colors shrink-0',
              secao === i ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            )}>
            {s}
          </button>
        ))}
      </div>

      {secao === 0 && (
        <div className="bg-gray-50 rounded-xl px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pt-1">Exame Extrabucal</p>
          <ExameFisicoField label="Face / Assimetria" value={fisico.face} onChange={v => setF('face', v)} />
          <ExameFisicoField label="ATM" value={fisico.atm} onChange={v => setF('atm', v)} placeholder="Ex: estalo, limitação, dor" />
          <ExameFisicoField label="Linfonodos" value={fisico.linfonodos} onChange={v => setF('linfonodos', v)} placeholder="Ex: aumentados, dolorosos" />
          <ExameFisicoField label="Lábios" value={fisico.labios} onChange={v => setF('labios', v)} />
          <ExameFisicoField label="Mucosa labial" value={fisico.mucosa_labial} onChange={v => setF('mucosa_labial', v)} />
        </div>
      )}

      {secao === 1 && (
        <div className="bg-gray-50 rounded-xl px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pt-1">Exame Intrabucal</p>
          <ExameFisicoField label="Mucosa oral" value={fisico.mucosa_oral} onChange={v => setF('mucosa_oral', v)} />
          <ExameFisicoField label="Língua / Assoalho" value={fisico.lingua} onChange={v => setF('lingua', v)} />
          <ExameFisicoField label="Assoalho bucal" value={fisico.assoalho} onChange={v => setF('assoalho', v)} />
          <ExameFisicoField label="Palato / Orofaringe" value={fisico.palato} onChange={v => setF('palato', v)} />
          <ExameFisicoField label="Gengiva / Periodonto" value={fisico.gengiva} onChange={v => setF('gengiva', v)} placeholder="Ex: hiperemia, retração, bolsa" />
        </div>
      )}

      {secao === 2 && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl px-4 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pt-1">Oclusão</p>
            <div className="py-2.5 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Classe de Angle</p>
              <div className="flex gap-2 flex-wrap">
                {['Classe I', 'Classe II div. 1', 'Classe II div. 2', 'Classe III'].map(c => (
                  <button key={c} type="button" onClick={() => setF('classe_angle', fisico.classe_angle === c ? '' : c)}
                    className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition-all',
                      fisico.classe_angle === c ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <ExameFisicoField label="Overjet (mm)" value={fisico.overjet} onChange={v => setF('overjet', v)} placeholder="Ex: 3mm" />
            <ExameFisicoField label="Overbite (mm)" value={fisico.overbite} onChange={v => setF('overbite', v)} placeholder="Ex: 2mm" />
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pt-1">DTM / Parafunções</p>
            <ExameFisicoField label="Sinais de DTM" value={fisico.dtm_sinais} onChange={v => setF('dtm_sinais', v)} placeholder="Ex: estalo, crepitação, trava" />
            <ExameFisicoField label="Parafunções" value={fisico.parafuncoes} onChange={v => setF('parafuncoes', v)} placeholder="Ex: bruxismo, onicofagia" />
          </div>
        </div>
      )}

      {secao === 3 && (
        <div className="bg-gray-50 rounded-xl px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 pt-1">Patologias Observadas</p>
          <ExameFisicoField label="Lesões de cárie" value={fisico.lesoes_carie} onChange={v => setF('lesoes_carie', v)} placeholder="Ex: dentes 36, 46 — cárie oclusal" />
          <ExameFisicoField label="Fraturas" value={fisico.fraturas} onChange={v => setF('fraturas', v)} placeholder="Ex: fratura de cúspide dente 16" />
          <ExameFisicoField label="Lesões em mucosas" value={fisico.lesoes_mucosa} onChange={v => setF('lesoes_mucosa', v)} placeholder="Ex: úlcera, leucoplasia, eritroplasia" />
          <ExameFisicoField label="Outras patologias" value={fisico.outras_patologias} onChange={v => setF('outras_patologias', v)} />
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button type="button" disabled={secao === 0} onClick={() => setSecao(s => s - 1)}
          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30">← Anterior</button>
        <div className="flex gap-1">
          {SECOES_TRATAMENTO.map((_, i) => (
            <div key={i} onClick={() => setSecao(i)}
              className={clsx('w-1.5 h-1.5 rounded-full cursor-pointer transition-colors',
                i === secao ? 'bg-teal-600' : 'bg-gray-300')} />
          ))}
        </div>
        <button type="button" disabled={secao === SECOES_TRATAMENTO.length - 1} onClick={() => setSecao(s => s + 1)}
          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30">Próxima →</button>
      </div>
    </div>
  )
}

// ─── formulário pedido de exame (exames complementares) ──────────────────────

function PedidoExameForm({ onChange }: { onChange: (d: object) => void }) {
  const [aba, setAba]                   = useState(0)
  const [selecionados, setSelecionados] = useState<ExameSelecionado[]>([])
  const [livres, setLivres]             = useState<{ titulo: string; descricao: string }[]>([])
  const [indicacao, setIndicacao]       = useState('')
  const [urgente, setUrgente]           = useState(false)

  function emitir(s = selecionados, l = livres, ind = indicacao, urg = urgente) {
    const exames = [
      ...s.map(e => ({ nome: e.nome, descricao: e.desc })),
      ...l.filter(e => e.titulo).map(e => ({ nome: e.titulo, descricao: e.descricao })),
    ]
    onChange({ exames, indicacao: ind, urgente: urg })
  }

  function toggleExame(nome: string, desc: string) {
    const existe = selecionados.find(e => e.nome === nome)
    const next = existe ? selecionados.filter(e => e.nome !== nome) : [...selecionados, { nome, desc }]
    setSelecionados(next); emitir(next)
  }

  function setDescricao(nome: string, val: string) {
    const next = selecionados.map(e => e.nome === nome ? { ...e, desc: val } : e)
    setSelecionados(next); emitir(next)
  }

  function addLivre() {
    const next = [...livres, { titulo: '', descricao: '' }]
    setLivres(next); emitir(selecionados, next)
  }
  function setLivre(i: number, field: 'titulo' | 'descricao', val: string) {
    const next = livres.map((l, idx) => idx === i ? { ...l, [field]: val } : l)
    setLivres(next); emitir(selecionados, next)
  }
  function removeLivre(i: number) {
    const next = livres.filter((_, idx) => idx !== i)
    setLivres(next); emitir(selecionados, next)
  }

  const totalExames = selecionados.length + livres.filter(l => l.titulo).length

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Selecione os exames solicitados</label>
        <div className="flex flex-wrap gap-1 mb-3">
          {[...CATEGORIAS_EXAME.map(c => c.nome), 'Personalizado'].map((nome, i) => (
            <button key={nome} type="button" onClick={() => setAba(i)}
              className={clsx('px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors',
                aba === i ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
              {nome}
            </button>
          ))}
        </div>

        {aba < CATEGORIAS_EXAME.length && (
          <div className="space-y-1.5">
            {CATEGORIAS_EXAME[aba].exames.map(exame => {
              const sel = selecionados.find(e => e.nome === exame.nome)
              return (
                <div key={exame.nome} className="space-y-1">
                  <label className={clsx('flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    sel ? 'bg-blue-50 border-blue-200' : 'border-gray-100 hover:border-gray-200')}>
                    <div onClick={() => toggleExame(exame.nome, exame.desc)}
                      className={clsx('w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors',
                        sel ? 'bg-blue-600 border-blue-600' : 'border-gray-300')}>
                      {sel && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-800 flex-1" onClick={() => toggleExame(exame.nome, exame.desc)}>
                      {exame.nome}
                    </span>
                  </label>
                  {sel && exame.desc && (
                    <input className="input text-sm ml-8" placeholder={`Detalhe: ${exame.desc}`}
                      value={sel.desc} onChange={e => setDescricao(exame.nome, e.target.value)} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {aba === CATEGORIAS_EXAME.length && (
          <div className="space-y-2">
            {livres.map((l, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input className="input flex-1 text-sm" placeholder="Nome do exame" value={l.titulo}
                    onChange={e => setLivre(i, 'titulo', e.target.value)} />
                  <button type="button" onClick={() => removeLivre(i)} className="p-1 text-gray-300 hover:text-red-500 rounded">
                    <X size={14} />
                  </button>
                </div>
                <textarea className="input w-full text-sm resize-none" rows={2}
                  placeholder="Região anatômica / detalhes..." value={l.descricao}
                  onChange={e => setLivre(i, 'descricao', e.target.value)} />
              </div>
            ))}
            <button type="button" onClick={addLivre} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Plus size={12} /> Adicionar exame personalizado
            </button>
          </div>
        )}
      </div>

      {totalExames > 0 && (
        <div className="bg-blue-50 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-blue-700 mb-1.5">{totalExames} exame(s) solicitado(s)</p>
          <ul className="space-y-0.5">
            {selecionados.map(e => <li key={e.nome} className="text-xs text-blue-600">• {e.nome}{e.desc ? ` — ${e.desc}` : ''}</li>)}
            {livres.filter(l => l.titulo).map((l, i) => <li key={i} className="text-xs text-blue-600">• {l.titulo}</li>)}
          </ul>
        </div>
      )}

      <div>
        <label className="label">Indicação clínica / Hipótese diagnóstica</label>
        <textarea className="input w-full resize-none text-sm" rows={3}
          placeholder="Descreva a indicação clínica e hipótese diagnóstica para os exames solicitados..."
          value={indicacao}
          onChange={e => { setIndicacao(e.target.value); emitir(selecionados, livres, e.target.value) }} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={urgente} className="accent-blue-600"
          onChange={e => { setUrgente(e.target.checked); emitir(selecionados, livres, indicacao, e.target.checked) }} />
        <span className="text-sm font-medium text-gray-700">Marcar como urgente</span>
      </label>
    </div>
  )
}

// ─── modal novo documento ─────────────────────────────────────────────────────

function NovoDocModal({ onClose, onSaved }: { onClose: () => void; onSaved: (d: DocRow) => void }) {
  const [step,         setStep]         = useState<1 | 2>(1)
  const [tipo,         setTipo]         = useState<TipoDoc | null>(null)
  const [paciente,     setPaciente]     = useState<PacienteBusca | null>(null)
  const [dados,        setDados]        = useState<object>({})
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [showCadastro, setShowCadastro] = useState(false)
  const [nomeCadastro, setNomeCadastro] = useState('')

  async function salvar() {
    if (!tipo || !paciente) { setError('Selecione um paciente cadastrado.'); return }
    setSaving(true); setError('')
    const { data, error: err } = await (supabase.from('documentos') as any).insert({
      tipo,
      paciente_id:   paciente.id,
      paciente_nome: paciente.nome,
      numero_documento: gerarNumero(tipo),
      conteudo_texto: JSON.stringify(dados),
    }).select().single()
    if (err) { setError(err.message); setSaving(false); return }
    onSaved(data as DocRow)
    onClose()
  }

  function handleCadastrar(nome: string) {
    setNomeCadastro(nome)
    setShowCadastro(true)
  }

  function handlePacienteCriado(p?: { id: string; nome: string; telefone: string | null }) {
    setShowCadastro(false)
    if (p) {
      setPaciente({ id: p.id, nome: p.nome, telefone: p.telefone, endereco: null, cpf: null, data_nascimento: null })
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-semibold text-gray-900">Novo documento</h2>
              {tipo && <p className="text-xs text-gray-400 mt-0.5">{tipoLabel(tipo)}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {TIPOS.map(t => (
                  <button key={t.id} onClick={() => { setTipo(t.id); setStep(2) }}
                    className={clsx('text-left p-4 rounded-xl border-2 transition-all hover:shadow-sm', t.cor)}>
                    <p className="font-semibold text-sm">{t.label}</p>
                    <p className="text-xs mt-0.5 opacity-70">{t.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && tipo && (
              <>
                <button onClick={() => { setStep(1); setTipo(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  ← Trocar tipo
                </button>
                <div>
                  <label className="label">Paciente *</label>
                  <BuscaPacienteInput value={paciente} onSelect={setPaciente} onCadastrar={handleCadastrar} />
                  {!paciente && (
                    <p className="mt-1.5 text-[11px] text-amber-600 flex items-center gap-1">
                      <AlertTriangle size={11} className="shrink-0" />
                      O paciente deve estar cadastrado para emitir documentos.
                    </p>
                  )}
                </div>
                {(tipo === 'receituario' || tipo === 'receituario_especial') &&
                  <ReceituarioForm especial={tipo === 'receituario_especial'} onChange={setDados} />}
                {tipo === 'atestado' && <AtestadoForm onChange={setDados} />}
                {tipo === 'pedido_exame' && <PedidoExameForm onChange={setDados} />}
                {tipo === 'tratamentos_realizados' && <TratamentosForm onChange={setDados} />}
                {error && <p className="text-sm text-red-600">{error}</p>}
              </>
            )}
          </div>

          {step === 2 && (
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end shrink-0">
              <button onClick={onClose} className="btn-secondary">Cancelar</button>
              <button onClick={salvar} disabled={saving || !paciente} className="btn-primary disabled:opacity-40">
                {saving ? 'Salvando...' : 'Salvar documento'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showCadastro && (
        <CadastrarPacienteModal
          nomeInicial={nomeCadastro}
          onClose={() => setShowCadastro(false)}
          onSaved={handlePacienteCriado}
        />
      )}
    </>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

type TipoFiltro = 'todos' | TipoDoc

export function DocumentosPage() {
  const router  = useRouter()
  const [filtro,  setFiltro]  = useState<TipoFiltro>('todos')
  const [busca,   setBusca]   = useState('')
  const [docs,    setDocs]    = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    let q = supabase.from('documentos').select('*').order('created_at', { ascending: false })
    if (filtro !== 'todos') q = q.eq('tipo', filtro)
    q.limit(50).then(({ data }) => { setDocs((data as DocRow[]) ?? []); setLoading(false) })
  }, [filtro])

  const docsFiltrados = docs.filter(d =>
    d.paciente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    d.numero_documento?.includes(busca)
  )

  async function deletar(id: string) {
    await supabase.from('documentos').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  function whatsapp(doc: DocRow) {
    const texto = encodeURIComponent(`Olá! Segue o documento *${tipoLabel(doc.tipo)}* — Nº ${doc.numero_documento ?? ''}. Acesse para visualizar e imprimir.`)
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={15} /> Novo documento
        </button>
      </div>

      <div className="card mb-4 px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['todos', ...TIPOS.map(t => t.id)] as TipoFiltro[]).map(t => (
            <button key={t} onClick={() => setFiltro(t)}
              className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                t === filtro ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
              {t === 'todos' ? 'Todos' : tipoLabel(t as TipoDoc)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 text-sm w-full" placeholder="Buscar por paciente ou número..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      <div className="card divide-y divide-gray-50">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : docsFiltrados.length === 0 ? (
          <div className="p-16 text-center">
            <FileText size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Nenhum documento encontrado</p>
          </div>
        ) : docsFiltrados.map(doc => (
          <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={18} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 text-sm">{doc.paciente_nome ?? '—'}</p>
                <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium', badgeColor(doc.tipo))}>
                  {tipoLabel(doc.tipo)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Nº {doc.numero_documento ?? '—'} · {doc.created_at
                  ? format(parseISO(doc.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => whatsapp(doc)}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Enviar via WhatsApp">
                <Send size={15} />
              </button>
              <button onClick={() => router.push(`/documentos/${doc.id}`)} className="btn-secondary text-xs py-1.5 px-3">
                <Printer size={13} /> Imprimir
              </button>
              <button onClick={() => deletar(doc.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <NovoDocModal onClose={() => setShowModal(false)} onSaved={d => setDocs(prev => [d, ...prev])} />
      )}
    </div>
  )
}

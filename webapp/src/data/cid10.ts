export interface CidEntry { codigo: string; descricao: string; proc?: string }

// CID-10 focado em odontologia + códigos frequentes em atestados
// proc = sinônimos de procedimentos/termos clínicos para facilitar a busca
export const CID10: CidEntry[] = [
  // ── K00–K14: Doenças da cavidade oral ──
  { codigo: 'K00',   descricao: 'Distúrbios do desenvolvimento e da erupção dos dentes', proc: 'desenvolvimento erupção dente' },
  { codigo: 'K00.0', descricao: 'Anodontia', proc: 'ausência congênita dentes' },
  { codigo: 'K00.1', descricao: 'Dentes supranumerários', proc: 'dente extra mesiodens' },
  { codigo: 'K00.2', descricao: 'Anomalias do tamanho e da forma dos dentes', proc: 'microdontia macrodontia fusão geminação' },
  { codigo: 'K00.3', descricao: 'Dentes malhados (fluorose dentária)', proc: 'fluorose manchas dente' },
  { codigo: 'K00.4', descricao: 'Distúrbios na formação dos dentes', proc: 'hipoplasia amelogênese dentinogênese' },
  { codigo: 'K00.5', descricao: 'Anomalias hereditárias da estrutura dentária', proc: 'amelogênese imperfeita dentinogênese imperfeita' },
  { codigo: 'K00.6', descricao: 'Distúrbios da erupção dentária', proc: 'erupção demorada retardo erupção' },
  { codigo: 'K01',   descricao: 'Dentes inclusos e impactados', proc: 'siso incluso impactado terceiro molar' },
  { codigo: 'K01.0', descricao: 'Dentes inclusos (sem impactação)', proc: 'incluso siso sem impactação' },
  { codigo: 'K01.1', descricao: 'Dentes impactados', proc: 'siso impactado terceiro molar juízo exodontia cirúrgica' },
  { codigo: 'K02',   descricao: 'Cárie dentária', proc: 'cárie restauração resina amálgama' },
  { codigo: 'K02.0', descricao: 'Cárie limitada ao esmalte', proc: 'cárie esmalte restauração' },
  { codigo: 'K02.1', descricao: 'Cárie da dentina', proc: 'cárie dentina restauração profunda' },
  { codigo: 'K02.2', descricao: 'Cárie do cemento', proc: 'cárie radicular cemento' },
  { codigo: 'K02.3', descricao: 'Cárie dentária interrompida', proc: 'cárie paralisada inativa' },
  { codigo: 'K02.9', descricao: 'Cárie dentária não especificada', proc: 'cárie restauração' },
  { codigo: 'K03',   descricao: 'Outras doenças dos tecidos duros dos dentes' },
  { codigo: 'K03.0', descricao: 'Atrito dentário excessivo', proc: 'bruxismo desgaste apertamento ranger dente' },
  { codigo: 'K03.1', descricao: 'Abrasão dentária', proc: 'abrasão escovação desgaste cervical' },
  { codigo: 'K03.2', descricao: 'Erosão dentária', proc: 'erosão ácido refluxo bulimia desgaste' },
  { codigo: 'K03.3', descricao: 'Reabsorção patológica dos dentes', proc: 'reabsorção radicular interna externa' },
  { codigo: 'K03.5', descricao: 'Anquilose dentária', proc: 'anquilose dente fusão osso' },
  { codigo: 'K03.6', descricao: 'Depósitos nos dentes (cálculo dentário)', proc: 'cálculo tártaro limpeza profilaxia raspagem' },
  { codigo: 'K04',   descricao: 'Doenças da polpa e dos tecidos periapicais', proc: 'endodontia canal polpa' },
  { codigo: 'K04.0', descricao: 'Pulpite', proc: 'pulpite dor canal endodontia tratamento de canal polpa inflamada' },
  { codigo: 'K04.1', descricao: 'Necrose da polpa', proc: 'necrose polpa canal endodontia dente morto' },
  { codigo: 'K04.2', descricao: 'Degeneração da polpa', proc: 'degeneração polpar calcificação canal' },
  { codigo: 'K04.3', descricao: 'Formação anormal de tecido duro na polpa', proc: 'calcificação polpar pólipo pulpar' },
  { codigo: 'K04.4', descricao: 'Periodontite apical aguda de origem pulpar', proc: 'periodontite apical aguda canal endodontia dor' },
  { codigo: 'K04.5', descricao: 'Periodontite apical crônica (granuloma apical)', proc: 'granuloma apical cisto endodontia canal reintervenção' },
  { codigo: 'K04.6', descricao: 'Abscesso periapical com fístula', proc: 'abscesso fístula drenagem canal endodontia' },
  { codigo: 'K04.7', descricao: 'Abscesso periapical sem fístula', proc: 'abscesso periapical incisão drenagem canal endodontia' },
  { codigo: 'K04.8', descricao: 'Cisto radicular', proc: 'cisto radicular apicectomia cirurgia parendodôntica' },
  { codigo: 'K04.9', descricao: 'Outras doenças da polpa e periápice', proc: 'endodontia canal retratamento' },
  { codigo: 'K05',   descricao: 'Gengivite e doenças periodontais', proc: 'periodontia gengiva' },
  { codigo: 'K05.0', descricao: 'Gengivite aguda', proc: 'gengivite aguda inflamação gengiva sangramento' },
  { codigo: 'K05.1', descricao: 'Gengivite crônica', proc: 'gengivite crônica inflamação gengiva sangramento profilaxia' },
  { codigo: 'K05.2', descricao: 'Periodontite aguda', proc: 'periodontite aguda abscesso periodontal raspagem periodontia' },
  { codigo: 'K05.3', descricao: 'Periodontite crônica', proc: 'periodontite crônica raspagem alisamento radicular periodontia cirurgia periodontal' },
  { codigo: 'K05.4', descricao: 'Periodontose', proc: 'periodontose periodontia jovem' },
  { codigo: 'K06.0', descricao: 'Recessão gengival', proc: 'recessão gengival enxerto gengiva cirurgia mucogengival' },
  { codigo: 'K06.1', descricao: 'Hipertrofia gengival', proc: 'hipertrofia gengival hiperplasia gengivectomia' },
  { codigo: 'K07',   descricao: 'Anomalias dentofaciais e outros transtornos dos maxilares', proc: 'ortodontia aparelho ortopedia' },
  { codigo: 'K07.0', descricao: 'Anomalias do tamanho dos maxilares', proc: 'micrognatia macrognatia prognatismo ortopedia cirurgia ortognática' },
  { codigo: 'K07.1', descricao: 'Anomalias da relação entre maxilares', proc: 'classe I II III ortopedia cirurgia ortognática' },
  { codigo: 'K07.2', descricao: 'Anomalias da relação entre arcos dentários', proc: 'mordida aberta cruzada sobremordida ortodontia' },
  { codigo: 'K07.3', descricao: 'Anomalias da posição dos dentes', proc: 'apinhamento rotação trespasse ortodontia aparelho' },
  { codigo: 'K07.4', descricao: 'Má oclusão não especificada', proc: 'má oclusão ortodontia aparelho tratamento ortopédico' },
  { codigo: 'K07.5', descricao: 'Doenças funcionais da articulação temporomandibular (DTM)', proc: 'DTM disfunção temporomandibular bruxismo placa miorrelaxante ATM dor orofacial' },
  { codigo: 'K07.6', descricao: 'Doenças da articulação temporomandibular (ATM)', proc: 'ATM articulação temporomandibular artralgia artroscopia' },
  { codigo: 'K08.1', descricao: 'Perda de dentes devida a acidente, extração ou doença local', proc: 'extração exodontia perda dental edêntulo prótese implante' },
  { codigo: 'K08.2', descricao: 'Atrofia do rebordo alveolar sem dentes', proc: 'rebordo reabsorvido edêntulo prótese implante enxerto ósseo' },
  { codigo: 'K08.3', descricao: 'Raiz dentária retida', proc: 'raiz retida resíduo exodontia cirúrgica' },
  { codigo: 'K09.0', descricao: 'Cistos odontogênicos do desenvolvimento', proc: 'cisto dentígero folicular odontogênico cirurgia' },
  { codigo: 'K09.2', descricao: 'Outros cistos dos maxilares', proc: 'cisto maxilar nasopalatino cirurgia' },
  { codigo: 'K10.2', descricao: 'Doenças inflamatórias dos maxilares (osteíte, osteomielite)', proc: 'osteíte osteomielite osteonecrose infecção óssea maxilar' },
  { codigo: 'K10.3', descricao: 'Alveolite do maxilar (alveolite seca)', proc: 'alveolite seca dry socket pós-extração dor pós-operatória' },
  { codigo: 'K11.2', descricao: 'Sialoadenite', proc: 'sialoadenite infecção glândula salivar parótida submandibular' },
  { codigo: 'K11.5', descricao: 'Sialolitíase (cálculo da glândula salivar)', proc: 'sialolito cálculo salivar obstrução glândula salivar' },
  { codigo: 'K11.6', descricao: 'Mucocele da glândula salivar', proc: 'mucocele rânula cisto mucoso cirurgia' },
  { codigo: 'K11.7', descricao: 'Distúrbios da secreção salivar (xerostomia, sialorréia)', proc: 'xerostomia boca seca sialorréia salivação excessiva' },
  { codigo: 'K12.0', descricao: 'Aftas bucais recorrentes (estomatite aftosa)', proc: 'afta úlcera aftosa estomatite recorrente' },
  { codigo: 'K12.1', descricao: 'Outras formas de estomatite', proc: 'estomatite mucosite ulceração' },
  { codigo: 'K12.2', descricao: 'Celulite e abscesso da boca', proc: 'celulite abscesso boca incisão drenagem infecção odontogênica' },
  { codigo: 'K13.0', descricao: 'Doenças dos lábios (queilite, queilodinia)', proc: 'queilite lábio fissura queiloplastia frenectomia' },
  { codigo: 'K13.2', descricao: 'Leucoplasia e outras perturbações do epitélio oral', proc: 'leucoplasia mancha branca lesão pré-maligna biópsia' },
  { codigo: 'K13.6', descricao: 'Hiperplasia irritativa da mucosa oral', proc: 'hiperplasia irritativa épulis fibroma cirurgia excisão' },
  { codigo: 'K13.7', descricao: 'Outras e não especificadas lesões da mucosa oral', proc: 'lesão mucosa biópsia cirurgia excisão' },
  { codigo: 'K14.0', descricao: 'Glossite', proc: 'glossite língua inflamação' },
  { codigo: 'K14.6', descricao: 'Glossodinia (glossopirose, dor na língua)', proc: 'glossodinia ardência bucal língua dor síndrome' },

  // ── Traumatismos dento-faciais ──
  { codigo: 'S00.5', descricao: 'Traumatismo superficial dos lábios e da cavidade oral', proc: 'trauma boca lábio queda acidente' },
  { codigo: 'S01.5', descricao: 'Ferimento aberto dos lábios e da cavidade oral', proc: 'laceração corte boca lábio sutura' },
  { codigo: 'S02.4', descricao: 'Fratura dos ossos malares e maxilares', proc: 'fratura maxilar zigoma malar trauma facial cirurgia' },
  { codigo: 'S02.5', descricao: 'Fratura de dentes', proc: 'fratura dente trauma avulsão luxação reimplante' },
  { codigo: 'S02.6', descricao: 'Fratura da mandíbula', proc: 'fratura mandíbula trauma cirurgia bucomaxilofacial' },
  { codigo: 'S03.2', descricao: 'Luxação de dente', proc: 'luxação avulsão reimplante trauma dente' },
  { codigo: 'S03.4', descricao: 'Entorse e distensão da articulação temporomandibular', proc: 'trauma ATM entorse articulação temporomandibular' },

  // ── Dor orofacial / neurologia ──
  { codigo: 'G50.0', descricao: 'Neuralgia do trigêmeo', proc: 'neuralgia trigêmeo dor facial choque elétrico' },
  { codigo: 'G50.1', descricao: 'Dor facial atípica', proc: 'dor facial atípica orofacial crônica' },
  { codigo: 'G51.0', descricao: 'Paralisia de Bell (paralisia facial)', proc: 'paralisia Bell facial nervus facialis' },
  { codigo: 'R51',   descricao: 'Cefaleia', proc: 'cefaleia dor cabeça enxaqueca' },
  { codigo: 'R52.0', descricao: 'Dor aguda', proc: 'dor aguda pós-operatória pós-extração' },
  { codigo: 'R52.1', descricao: 'Dor crônica intratável', proc: 'dor crônica neuropática persistente' },

  // ── Infecções ──
  { codigo: 'B00.1', descricao: 'Herpes simples — gengivoestomatite herpética', proc: 'herpes simples estomatite herpética primária' },
  { codigo: 'B00.2', descricao: 'Herpes labial', proc: 'herpes labial fogo selvagem bolha lábio' },
  { codigo: 'B02.2', descricao: 'Herpes zoster com neuralgia pós-herpética', proc: 'herpes zoster cobreiro neuralgia' },
  { codigo: 'B37.0', descricao: 'Candidose da boca (sapinho)', proc: 'candidose sapinho candida oral antifúngico nistatina' },

  // ── Neoplasias ──
  { codigo: 'C00',   descricao: 'Neoplasia maligna do lábio', proc: 'câncer lábio carcinoma biópsia' },
  { codigo: 'C02',   descricao: 'Neoplasia maligna da língua', proc: 'câncer língua carcinoma biópsia' },
  { codigo: 'C04',   descricao: 'Neoplasia maligna do assoalho da boca', proc: 'câncer assoalho boca carcinoma biópsia' },
  { codigo: 'C06',   descricao: 'Neoplasia maligna da boca', proc: 'câncer boca carcinoma biópsia cirurgia' },
  { codigo: 'D10',   descricao: 'Neoplasia benigna da boca e da faringe', proc: 'tumor benigno fibroma papiloma cisto excisão biópsia' },
  { codigo: 'D16.5', descricao: 'Neoplasia benigna dos ossos do crânio e da face', proc: 'tumor benigno maxilar mandíbula osteoma ameloblastoma' },

  // ── Procedimentos / pós-operatório ──
  { codigo: 'Z29.8', descricao: 'Outras medidas profiláticas especificadas', proc: 'cirurgia profilática prevenção' },
  { codigo: 'Z40',   descricao: 'Cirurgia profilática', proc: 'cirurgia preventiva profilaxia' },
  { codigo: 'Z48',   descricao: 'Outros cuidados pós-operatórios', proc: 'pós-operatório pós-cirúrgico cuidados repouso' },
  { codigo: 'Z48.8', descricao: 'Outros cuidados pós-cirúrgicos especificados', proc: 'pós-operatório repouso recuperação cirurgia oral' },
  { codigo: 'Z96.5', descricao: 'Presença de implantes de raiz dentária', proc: 'implante dental osseointegrado implantodontia' },
  { codigo: 'Z97.2', descricao: 'Presença de prótese dentária', proc: 'prótese dentária total parcial removível fixa coroa ponte' },

  // ── Sistêmicos frequentes ──
  { codigo: 'F40.2', descricao: 'Fobias específicas (inclui odontofobia)', proc: 'odontofobia medo dentista fobia ansiedade' },
  { codigo: 'F41.1', descricao: 'Ansiedade generalizada', proc: 'ansiedade sedação ansiolítico tranquilizante' },
  { codigo: 'E11',   descricao: 'Diabetes mellitus tipo 2', proc: 'diabetes diabético glicemia' },
  { codigo: 'I10',   descricao: 'Hipertensão essencial (primária)', proc: 'hipertensão pressão alta' },
  { codigo: 'K21.0', descricao: 'Doença de refluxo gastroesofágico com esofagite', proc: 'refluxo erosão dental ácido' },
  { codigo: 'M79.1', descricao: 'Mialgia (dor muscular — musculatura mastigatória)', proc: 'mialgia dor muscular mastigatória DTM bruxismo' },
]

export function buscarCid(query: string): CidEntry[] {
  if (query.length < 2) return []
  const q = query.toLowerCase()
  return CID10.filter(
    c =>
      c.codigo.toLowerCase().includes(q) ||
      c.descricao.toLowerCase().includes(q) ||
      (c.proc?.toLowerCase().includes(q) ?? false)
  ).slice(0, 10)
}

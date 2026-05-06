import { PacienteDetalhePage } from '@/components/Pacientes/PacienteDetalhePage'

export default function Page({ params }: { params: { id: string } }) {
  return <PacienteDetalhePage id={params.id} />
}

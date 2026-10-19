import { useState, type ReactNode } from 'react'
import { Boton } from './Boton'
import { Modal } from './Modal'
import { Alerta } from './Tarjeta'

interface Props {
  titulo: string
  mensaje: ReactNode
  textoConfirmar: string
  peligro?: boolean
  /** Contenido extra (ej: un campo de motivo). */
  children?: ReactNode
  onConfirmar: () => Promise<unknown>
  onCerrar: () => void
}

/** Diálogo de confirmación que muestra el error del servidor si la acción falla. */
export function Confirmar({ titulo, mensaje, textoConfirmar, peligro, children, onConfirmar, onCerrar }: Props) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmar = async () => {
    setCargando(true)
    setError(null)
    try {
      await onConfirmar()
      onCerrar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción')
      setCargando(false)
    }
  }

  return (
    <Modal
      abierto
      titulo={titulo}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Volver
          </Boton>
          <Boton variante={peligro ? 'peligro' : 'primario'} cargando={cargando} onClick={confirmar}>
            {textoConfirmar}
          </Boton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alerta>{error}</Alerta>}
        <div className="text-sm text-slate-600">{mensaje}</div>
        {children}
      </div>
    </Modal>
  )
}

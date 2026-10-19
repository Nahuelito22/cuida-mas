import { Link, Navigate, Route, Routes } from 'react-router'
import { INICIO_POR_ROL, useAuth } from './auth/sesion'
import { RutaProtegida } from './auth/RutaProtegida'
import { LayoutApp } from './components/layout/LayoutApp'
import { DerivarPage } from './pages/admin/DerivarPage'
import { GestionSolicitudesPage } from './pages/admin/GestionSolicitudesPage'
import { PanelPage } from './pages/admin/PanelPage'
import { PracticasPage } from './pages/admin/PracticasPage'
import { VerificacionesPage } from './pages/admin/VerificacionesPage'
import { ZonasPage } from './pages/admin/ZonasPage'
import { AsignadasPage } from './pages/enfermero/AsignadasPage'
import { DisponiblesPage } from './pages/enfermero/DisponiblesPage'
import { MiPerfilPage } from './pages/enfermero/MiPerfilPage'
import { InicioPage } from './pages/InicioPage'
import { LoginPage } from './pages/LoginPage'
import { EnfermerosPage } from './pages/paciente/EnfermerosPage'
import { MisSolicitudesPage } from './pages/paciente/MisSolicitudesPage'
import { RegistroPage } from './pages/RegistroPage'

function InicioSegunRol() {
  const { usuario } = useAuth()
  return <Navigate to={usuario ? INICIO_POR_ROL[usuario.rol] : '/login'} replace />
}

function NoEncontrada() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <p className="text-slate-600">La página que buscás no existe.</p>
      <Link to="/" className="font-medium text-brand-600 hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<InicioPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />

      {/* Sección protegida: requiere sesión; cada grupo además exige un rol */}
      <Route
        path="/app"
        element={
          <RutaProtegida>
            <LayoutApp />
          </RutaProtegida>
        }
      >
        <Route index element={<InicioSegunRol />} />
        <Route path="enfermeros" element={<EnfermerosPage />} />

        <Route path="solicitudes" element={<RutaProtegida roles={['PACIENTE']}><MisSolicitudesPage /></RutaProtegida>} />

        <Route path="disponibles" element={<RutaProtegida roles={['ENFERMERO']}><DisponiblesPage /></RutaProtegida>} />
        <Route path="asignadas" element={<RutaProtegida roles={['ENFERMERO']}><AsignadasPage /></RutaProtegida>} />
        <Route path="perfil" element={<RutaProtegida roles={['ENFERMERO']}><MiPerfilPage /></RutaProtegida>} />

        <Route path="panel" element={<RutaProtegida roles={['ADMIN']}><PanelPage /></RutaProtegida>} />
        <Route path="derivar" element={<RutaProtegida roles={['ADMIN']}><DerivarPage /></RutaProtegida>} />
        <Route path="gestion" element={<RutaProtegida roles={['ADMIN']}><GestionSolicitudesPage /></RutaProtegida>} />
        <Route path="verificaciones" element={<RutaProtegida roles={['ADMIN']}><VerificacionesPage /></RutaProtegida>} />
        <Route path="practicas" element={<RutaProtegida roles={['ADMIN']}><PracticasPage /></RutaProtegida>} />
        <Route path="zonas" element={<RutaProtegida roles={['ADMIN']}><ZonasPage /></RutaProtegida>} />
      </Route>

      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}

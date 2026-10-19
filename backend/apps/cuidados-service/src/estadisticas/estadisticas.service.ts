import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EstadoSolicitud } from '@app/common';
import { Zona, ZonaDocument } from '../zonas/zona.schema';
import { Enfermero, EnfermeroDocument } from '../enfermeros/enfermero.schema';
import { Solicitud, SolicitudDocument } from '../solicitudes/solicitud.schema';

export type NivelCobertura = 'SIN_DEMANDA' | 'ADECUADA' | 'BAJA' | 'CRITICA';

export interface CoberturaZona {
  zonaId: string;
  zona: string;
  departamento: string;
  enfermerosVerificados: number;
  pendientes: number;
  activas: number;
  finalizadas: number;
  /** Solicitudes abiertas (pendientes + activas) por enfermero verificado. */
  cargaPorEnfermero: number | null;
  nivel: NivelCobertura;
}

/** Más de esta cantidad de solicitudes abiertas por enfermero se considera cobertura baja. */
const CARGA_MAXIMA_ADECUADA = 3;

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Zona.name) private readonly zonaModel: Model<ZonaDocument>,
    @InjectModel(Enfermero.name)
    private readonly enfermeroModel: Model<EnfermeroDocument>,
    @InjectModel(Solicitud.name)
    private readonly solicitudModel: Model<SolicitudDocument>,
  ) {}

  /** Compara la demanda de cuidados con la oferta de enfermeros en cada zona. */
  async coberturaPorZona(): Promise<CoberturaZona[]> {
    const [zonas, enfermerosPorZona, solicitudesPorZona] = await Promise.all([
      this.zonaModel.find().sort({ departamento: 1, nombre: 1 }).lean(),
      this.enfermeroModel.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: { verificado: true } },
        { $unwind: '$zonas' },
        { $group: { _id: '$zonas', total: { $sum: 1 } } },
      ]),
      this.solicitudModel.aggregate<{
        _id: { zona: Types.ObjectId; estado: EstadoSolicitud };
        total: number;
      }>([
        {
          $group: {
            _id: { zona: '$zona', estado: '$estado' },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    const enfermeros = new Map(
      enfermerosPorZona.map((e) => [String(e._id), e.total]),
    );
    const contar = (zonaId: string, estados: EstadoSolicitud[]) =>
      solicitudesPorZona
        .filter(
          (s) =>
            String(s._id.zona) === zonaId && estados.includes(s._id.estado),
        )
        .reduce((suma, s) => suma + s.total, 0);

    return zonas
      .map((zona) => {
        const zonaId = String(zona._id);
        const enfermerosVerificados = enfermeros.get(zonaId) ?? 0;
        const pendientes = contar(zonaId, [EstadoSolicitud.PENDIENTE]);
        const activas = contar(zonaId, [
          EstadoSolicitud.ACEPTADA,
          EstadoSolicitud.EN_CURSO,
        ]);
        const finalizadas = contar(zonaId, [EstadoSolicitud.FINALIZADA]);
        const abiertas = pendientes + activas;
        const carga =
          enfermerosVerificados > 0 ? abiertas / enfermerosVerificados : null;

        return {
          zonaId,
          zona: zona.nombre,
          departamento: zona.departamento,
          enfermerosVerificados,
          pendientes,
          activas,
          finalizadas,
          cargaPorEnfermero:
            carga === null ? null : Math.round(carga * 10) / 10,
          nivel: calcularNivel(abiertas, carga),
        };
      })
      .sort((a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]);
  }
}

const ORDEN_NIVEL: Record<NivelCobertura, number> = {
  CRITICA: 0,
  BAJA: 1,
  ADECUADA: 2,
  SIN_DEMANDA: 3,
};

export function calcularNivel(
  abiertas: number,
  carga: number | null,
): NivelCobertura {
  if (abiertas === 0) return 'SIN_DEMANDA';
  if (carga === null) return 'CRITICA';
  return carga > CARGA_MAXIMA_ADECUADA ? 'BAJA' : 'ADECUADA';
}

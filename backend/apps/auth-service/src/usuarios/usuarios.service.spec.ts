import { Test } from '@nestjs/testing';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import { Rol } from '@app/common';
import { Usuario, UsuarioDocument, UsuarioSchema } from './usuario.schema';
import { UsuariosService } from './usuarios.service';

/** Ejecuta la promesa y devuelve el cuerpo del RpcException que lanzó. */
async function errorDe(promesa: Promise<unknown>) {
  try {
    await promesa;
  } catch (error) {
    expect(error).toBeInstanceOf(RpcException);
    return (error as RpcException).getError() as {
      statusCode: number;
      message: string;
    };
  }
  throw new Error('Se esperaba un error y no ocurrió');
}

const datosValidos = {
  email: 'Laura.Gomez@Mail.com',
  password: 'ClaveSegura123',
  nombre: 'Laura',
  apellido: 'Gómez',
  dni: '30111222',
};

describe('UsuariosService (unit, con MongoDB en memoria)', () => {
  let mongo: MongoMemoryServer;
  let service: UsuariosService;
  let usuarioModel: Model<UsuarioDocument>;
  let cerrar: () => Promise<void>;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: Usuario.name, schema: UsuarioSchema },
        ]),
      ],
      providers: [UsuariosService],
    }).compile();

    service = moduleRef.get(UsuariosService);
    usuarioModel = moduleRef.get(getModelToken(Usuario.name));
    await usuarioModel.syncIndexes(); // asegura los índices únicos antes de probar
    cerrar = async () => {
      await moduleRef.close();
      await mongo.stop();
    };
  });

  afterEach(() => usuarioModel.deleteMany({}));
  afterAll(() => cerrar());

  describe('validación de creación de entidades', () => {
    it('crea un usuario válido, normaliza el email y nunca devuelve la contraseña', async () => {
      const usuario = await service.crear(datosValidos);
      const json = usuario.toJSON() as Record<string, unknown>;

      expect(json.id).toBeDefined();
      expect(json.email).toBe('laura.gomez@mail.com');
      expect(json.rol).toBe(Rol.PACIENTE);
      expect(json.passwordHash).toBeUndefined();
      expect(json._id).toBeUndefined();

      // En la base la contraseña está hasheada, no en texto plano.
      const guardado = await usuarioModel
        .findById(usuario.id)
        .select('+passwordHash');
      expect(guardado!.passwordHash).not.toBe(datosValidos.password);
      expect(guardado!.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('rechaza un email con formato inválido (400)', async () => {
      const error = await errorDe(
        service.crear({ ...datosValidos, email: 'no-es-un-email' }),
      );
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('email');
    });

    it('rechaza un DNI inválido y una contraseña corta (400)', async () => {
      const dni = await errorDe(service.crear({ ...datosValidos, dni: '12a' }));
      expect(dni.statusCode).toBe(400);

      const pass = await errorDe(
        service.crear({ ...datosValidos, password: '123' }),
      );
      expect(pass.statusCode).toBe(400);
    });
  });

  describe('datos únicos duplicados', () => {
    it('devuelve 409 al registrar dos veces el mismo email (sin importar mayúsculas)', async () => {
      await service.crear(datosValidos);
      const error = await errorDe(
        service.crear({
          ...datosValidos,
          email: 'LAURA.GOMEZ@mail.com',
          dni: '99888777',
        }),
      );
      expect(error.statusCode).toBe(409);
      expect(error.message).toContain('email');
    });

    it('devuelve 409 al registrar dos veces el mismo DNI', async () => {
      await service.crear(datosValidos);
      const error = await errorDe(
        service.crear({ ...datosValidos, email: 'otra@mail.com' }),
      );
      expect(error.statusCode).toBe(409);
      expect(error.message).toContain('DNI');
    });
  });

  it('busca usuarios por rol y texto', async () => {
    await service.crear(datosValidos);
    await service.crear({
      ...datosValidos,
      email: 'enf@mail.com',
      dni: '22333444',
      nombre: 'Pedro',
      apellido: 'Ruiz',
      rol: Rol.ENFERMERO,
    });

    const pacientes = await service.buscar({ rol: Rol.PACIENTE, q: 'gom' });
    expect(pacientes).toHaveLength(1);
    expect(pacientes[0].nombre).toBe('Laura');

    // Caracteres especiales del usuario no rompen la expresión regular.
    await expect(service.buscar({ q: '(*' })).resolves.toEqual([]);
  });
});

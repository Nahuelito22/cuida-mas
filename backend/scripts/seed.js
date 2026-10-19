/**
 * Script de inicialización de la base de datos de Cuidá+.
 *
 * Carga datos de demostración en las dos bases (una por microservicio):
 *   - cuidamas_auth:     usuarios (admin, pacientes, enfermeros)
 *   - cuidamas_cuidados: zonas, prácticas, perfiles de enfermeros, solicitudes,
 *                        visitas y reseñas
 *
 * Uso:
 *   node scripts/seed.js           -> carga solo si la base está vacía
 *   node scripts/seed.js --reset   -> borra todo y vuelve a cargar
 *
 * Variables de entorno: AUTH_MONGO_URI y CUIDADOS_MONGO_URI.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AUTH_URI =
  process.env.AUTH_MONGO_URI || 'mongodb://localhost:27030/cuidamas_auth';
const CUIDADOS_URI =
  process.env.CUIDADOS_MONGO_URI ||
  'mongodb://localhost:27030/cuidamas_cuidados';
const RESET = process.argv.includes('--reset');

const { ObjectId } = mongoose.Types;
const ahora = new Date();
const dias = (n) => new Date(ahora.getTime() + n * 24 * 60 * 60 * 1000);

async function main() {
  const auth = await mongoose.createConnection(AUTH_URI).asPromise();
  const cuidados = await mongoose.createConnection(CUIDADOS_URI).asPromise();
  const col = {
    usuarios: auth.collection('usuarios'),
    zonas: cuidados.collection('zonas'),
    practicas: cuidados.collection('practicas'),
    enfermeros: cuidados.collection('enfermeros'),
    solicitudes: cuidados.collection('solicitudes'),
    visitas: cuidados.collection('visitas'),
    resenas: cuidados.collection('resenas'),
  };

  if (!RESET && (await col.usuarios.countDocuments()) > 0) {
    console.log('[seed] La base ya tiene datos: no se modifica (usá --reset para recargar).');
    await Promise.all([auth.close(), cuidados.close()]);
    return;
  }

  console.log('[seed] Limpiando colecciones...');
  await Promise.all(Object.values(col).map((c) => c.deleteMany({})));

  const conFechas = (doc) => ({ ...doc, createdAt: ahora, updatedAt: ahora });

  // ---------- Usuarios (auth-service) ----------
  const hash = (password) => bcrypt.hashSync(password, 10);
  const u = (id, email, password, nombre, apellido, dni, rol, telefono) =>
    conFechas({
      _id: id,
      email,
      passwordHash: hash(password),
      nombre,
      apellido,
      dni,
      telefono,
      rol,
      activo: true,
    });

  const ids = {
    admin: new ObjectId(),
    rosa: new ObjectId(),
    jorge: new ObjectId(),
    elena: new ObjectId(),
    laura: new ObjectId(),
    martin: new ObjectId(),
    sofia: new ObjectId(),
    diego: new ObjectId(),
  };

  await col.usuarios.insertMany([
    u(ids.admin, 'admin@cuidamas.com', 'Admin1234', 'Centro de Salud', 'N° 30', '10000001', 'ADMIN', '2614200000'),
    u(ids.rosa, 'paciente@cuidamas.com', 'Paciente123', 'Rosa', 'López', '20111222', 'PACIENTE', '2615111222'),
    u(ids.jorge, 'jorge.diaz@mail.com', 'Paciente123', 'Jorge', 'Díaz', '18333444', 'PACIENTE', '2615333444'),
    u(ids.elena, 'elena.sosa@mail.com', 'Paciente123', 'Elena', 'Sosa', '14555666', 'PACIENTE', '2615555666'),
    u(ids.laura, 'enfermera@cuidamas.com', 'Enfermera123', 'Laura', 'Gómez', '30111222', 'ENFERMERO', '2616111222'),
    u(ids.martin, 'martin.ruiz@mail.com', 'Enfermero123', 'Martín', 'Ruiz', '31222333', 'ENFERMERO', '2616222333'),
    u(ids.sofia, 'sofia.castro@mail.com', 'Enfermera123', 'Sofía', 'Castro', '32333444', 'ENFERMERO', '2616333444'),
    u(ids.diego, 'diego.molina@mail.com', 'Enfermero123', 'Diego', 'Molina', '33444555', 'ENFERMERO', '2616444555'),
  ]);

  // ---------- Zonas ----------
  const zona = (nombre, departamento) =>
    conFechas({ _id: new ObjectId(), nombre, departamento });
  const zonas = {
    capital: zona('4ta Sección', 'Capital'),
    godoyCruz: zona('Godoy Cruz Centro', 'Godoy Cruz'),
    villaNueva: zona('Villa Nueva', 'Guaymallén'),
    algarrobal: zona('El Algarrobal', 'Las Heras'),
    coquimbito: zona('Coquimbito', 'Maipú'),
    chacras: zona('Chacras de Coria', 'Luján de Cuyo'),
    costaAraujo: zona('Costa de Araujo', 'Lavalle'),
    palmira: zona('Palmira', 'San Martín'),
  };
  await col.zonas.insertMany(Object.values(zonas));

  // ---------- Prácticas ----------
  const practica = (nombre, descripcion, duracionEstimadaMin) =>
    conFechas({ _id: new ObjectId(), nombre, descripcion, duracionEstimadaMin, activa: true });
  const p = {
    curacion: practica('Curación de heridas', 'Limpieza y vendaje de heridas quirúrgicas o crónicas.', 30),
    inyectable: practica('Aplicación de inyectables', 'Intramusculares y subcutáneos (ej. heparina, antibióticos).', 15),
    signos: practica('Control de signos vitales', 'Presión arterial, temperatura, frecuencia cardíaca y saturación.', 20),
    sonda: practica('Cambio de sonda vesical', 'Recambio y cuidado de sonda.', 40),
    glucemia: practica('Control de glucemia', 'Medición capilar y registro.', 10),
    ulceras: practica('Cuidado de úlceras por presión', 'Prevención, rotación y curación de escaras.', 45),
    puntos: practica('Retiro de puntos', 'Retiro de suturas post-quirúrgicas.', 20),
    endovenosa: practica('Medicación endovenosa', 'Administración por vía periférica.', 60),
  };
  await col.practicas.insertMany(Object.values(p));

  // ---------- Perfiles de enfermeros ----------
  const enfermero = (usuarioId, nombre, apellido, matricula, telefono, bio, zonasEnf, practicasEnf, verificado) =>
    conFechas({
      _id: new ObjectId(),
      usuarioId: usuarioId.toString(),
      nombre,
      apellido,
      matricula,
      telefono,
      bio,
      zonas: zonasEnf.map((z) => z._id),
      practicas: practicasEnf.map((x) => x._id),
      verificado,
      puntajePromedio: 0,
      cantidadResenas: 0,
    });
  const enf = {
    laura: enfermero(ids.laura, 'Laura', 'Gómez', 'MP-10234', '2616111222',
      'Enfermera con 8 años en clínica médica. Especializada en heridas.',
      [zonas.capital, zonas.godoyCruz, zonas.villaNueva],
      [p.curacion, p.inyectable, p.signos, p.ulceras, p.puntos], true),
    martin: enfermero(ids.martin, 'Martín', 'Ruiz', 'MP-20877', '2616222333',
      'Enfermero de terapia intensiva, atención domiciliaria por la tarde.',
      [zonas.villaNueva, zonas.algarrobal, zonas.coquimbito],
      [p.inyectable, p.signos, p.sonda, p.endovenosa, p.glucemia], true),
    sofia: enfermero(ids.sofia, 'Sofía', 'Castro', 'MP-31540', '2616333444',
      'Licenciada en enfermería, experiencia en adultos mayores.',
      [zonas.chacras, zonas.godoyCruz],
      [p.curacion, p.signos, p.glucemia, p.ulceras], true),
    diego: enfermero(ids.diego, 'Diego', 'Molina', 'MP-40012', '2616444555',
      'Recién matriculado, disponible en el este provincial.',
      [zonas.palmira],
      [p.inyectable, p.signos], false), // pendiente de verificación (para la demo)
  };
  await col.enfermeros.insertMany(Object.values(enf));

  // ---------- Solicitudes ----------
  const solicitud = (datos) =>
    conFechas({
      _id: new ObjectId(),
      enfermero: null,
      estado: 'PENDIENTE',
      ...datos,
    });
  const nombre = { rosa: 'Rosa López', jorge: 'Jorge Díaz', elena: 'Elena Sosa' };
  const s = {
    // Derivación del centro, ya en curso con Laura
    rosaPostQx: solicitud({
      pacienteId: ids.rosa.toString(), pacienteNombre: nombre.rosa, creadaPorId: ids.admin.toString(),
      origen: 'DERIVACION', centroOrigen: 'Hospital Central - Cirugía General',
      zona: zonas.capital._id, practicas: [p.curacion._id, p.puntos._id],
      direccion: 'Av. Colón 845, Ciudad', fechaInicio: dias(-5), fechaFin: dias(5),
      frecuencia: 'Día por medio', observaciones: 'Post colecistectomía. Herida limpia al alta.',
      estado: 'EN_CURSO', enfermero: enf.laura._id, fechaAceptacion: dias(-5),
    }),
    // Particular finalizada y calificada
    rosaInyectables: solicitud({
      pacienteId: ids.rosa.toString(), pacienteNombre: nombre.rosa, creadaPorId: ids.rosa.toString(),
      origen: 'PARTICULAR', zona: zonas.capital._id, practicas: [p.inyectable._id],
      direccion: 'Av. Colón 845, Ciudad', fechaInicio: dias(-30), fechaFin: dias(-24),
      frecuencia: 'Diaria', estado: 'FINALIZADA', enfermero: enf.laura._id,
      fechaAceptacion: dias(-30), fechaFinalizacion: dias(-24),
    }),
    // Pendientes en Villa Nueva (las ve Laura y Martín según prácticas)
    jorgeSignos: solicitud({
      pacienteId: ids.jorge.toString(), pacienteNombre: nombre.jorge, creadaPorId: ids.jorge.toString(),
      origen: 'PARTICULAR', zona: zonas.villaNueva._id, practicas: [p.signos._id, p.inyectable._id],
      direccion: 'Bandera de los Andes 2300, Villa Nueva', fechaInicio: dias(1), fechaFin: dias(15),
      frecuencia: 'Lunes, miércoles y viernes', observaciones: 'Hipertenso, control de presión.',
    }),
    jorgeSonda: solicitud({
      pacienteId: ids.jorge.toString(), pacienteNombre: nombre.jorge, creadaPorId: ids.admin.toString(),
      origen: 'DERIVACION', centroOrigen: 'Hospital Lagomaggiore - Urología',
      zona: zonas.villaNueva._id, practicas: [p.sonda._id],
      direccion: 'Bandera de los Andes 2300, Villa Nueva', fechaInicio: dias(2), fechaFin: dias(32),
      frecuencia: 'Cada 15 días',
    }),
    // Aceptada por Sofía, todavía sin visitas
    elenaUlceras: solicitud({
      pacienteId: ids.elena.toString(), pacienteNombre: nombre.elena, creadaPorId: ids.admin.toString(),
      origen: 'DERIVACION', centroOrigen: 'Hospital Italiano - Clínica Médica',
      zona: zonas.chacras._id, practicas: [p.ulceras._id, p.signos._id],
      direccion: 'Viamonte 4800, Chacras de Coria', fechaInicio: dias(0), fechaFin: dias(20),
      frecuencia: 'Diaria', observaciones: 'Paciente postrada, úlcera sacra grado II.',
      estado: 'ACEPTADA', enfermero: enf.sofia._id, fechaAceptacion: dias(-1),
    }),
    // Zonas sin enfermeros verificados: aparecen como cobertura CRÍTICA
    elenaLavalle: solicitud({
      pacienteId: ids.elena.toString(), pacienteNombre: nombre.elena, creadaPorId: ids.admin.toString(),
      origen: 'DERIVACION', centroOrigen: 'Hospital Sícoli - Lavalle',
      zona: zonas.costaAraujo._id, practicas: [p.curacion._id],
      direccion: 'Ruta 34 km 12, Costa de Araujo', fechaInicio: dias(1), fechaFin: dias(10),
      frecuencia: 'Diaria',
    }),
    jorgePalmira: solicitud({
      pacienteId: ids.jorge.toString(), pacienteNombre: nombre.jorge, creadaPorId: ids.jorge.toString(),
      origen: 'PARTICULAR', zona: zonas.palmira._id, practicas: [p.inyectable._id],
      direccion: 'San Martín 120, Palmira', fechaInicio: dias(3), fechaFin: dias(8),
      frecuencia: 'Diaria',
    }),
    // Cancelada
    rosaCancelada: solicitud({
      pacienteId: ids.rosa.toString(), pacienteNombre: nombre.rosa, creadaPorId: ids.rosa.toString(),
      origen: 'PARTICULAR', zona: zonas.godoyCruz._id, practicas: [p.glucemia._id],
      direccion: 'San Martín 1500, Godoy Cruz', fechaInicio: dias(-10), fechaFin: dias(-3),
      frecuencia: 'Diaria', estado: 'CANCELADA', motivoCancelacion: 'La paciente fue reinternada.',
    }),
  };
  await col.solicitudes.insertMany(Object.values(s));

  // ---------- Bitácora de visitas ----------
  const visita = (sol, enfermeroId, fecha, practicas, observaciones, extra = {}) =>
    conFechas({
      _id: new ObjectId(), solicitud: sol._id, enfermero: enfermeroId, fecha,
      practicasRealizadas: practicas.map((x) => x._id), observaciones, ...extra,
    });
  await col.visitas.insertMany([
    visita(s.rosaPostQx, enf.laura._id, dias(-5), [p.curacion],
      'Primera curación. Herida limpia, bordes afrontados, sin secreción.', { presionArterial: '130/85', temperatura: 36.6 }),
    visita(s.rosaPostQx, enf.laura._id, dias(-3), [p.curacion],
      'Buena evolución. Leve eritema perilesional, se indica control.', { presionArterial: '125/80', temperatura: 36.9 }),
    visita(s.rosaPostQx, enf.laura._id, dias(-1), [p.curacion, p.puntos],
      'Se retiran puntos alternos. Sin signos de infección.', { presionArterial: '120/80', temperatura: 36.5 }),
    ...[-30, -29, -28, -27, -26, -25, -24].map((d) =>
      visita(s.rosaInyectables, enf.laura._id, dias(d), [p.inyectable], 'Aplicación de antibiótico IM sin complicaciones.')),
  ]);

  // ---------- Reseñas ----------
  await col.resenas.insertOne(conFechas({
    _id: new ObjectId(), solicitud: s.rosaInyectables._id, enfermero: enf.laura._id,
    pacienteId: ids.rosa.toString(), pacienteNombre: nombre.rosa, puntaje: 5,
    comentario: 'Muy puntual y explica todo con paciencia.',
  }));
  await col.enfermeros.updateOne({ _id: enf.laura._id }, { $set: { puntajePromedio: 5, cantidadResenas: 1 } });

  console.log('[seed] Datos cargados:');
  console.table([
    { rol: 'ADMIN', email: 'admin@cuidamas.com', password: 'Admin1234' },
    { rol: 'PACIENTE', email: 'paciente@cuidamas.com', password: 'Paciente123' },
    { rol: 'ENFERMERO', email: 'enfermera@cuidamas.com', password: 'Enfermera123' },
    { rol: 'ENFERMERO (sin verificar)', email: 'diego.molina@mail.com', password: 'Enfermero123' },
  ]);

  await Promise.all([auth.close(), cuidados.close()]);
}

main().catch((error) => {
  console.error('[seed] Error:', error);
  process.exit(1);
});

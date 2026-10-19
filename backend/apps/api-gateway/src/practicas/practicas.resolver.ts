import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CUIDADOS_PATTERNS, Rol } from '@app/common';
import { CuidadosClient } from '../common/microservicios';
import { Roles } from '../common/decorators';
import {
  ActualizarPracticaInput,
  CrearPracticaInput,
  PracticaModel,
} from './practica.graphql';

/** CRUD GraphQL #1: catálogo de prácticas. Leer: cualquier usuario logueado. Escribir: ADMIN. */
@Resolver(() => PracticaModel)
export class PracticasResolver {
  constructor(private readonly cuidados: CuidadosClient) {}

  @Query(() => [PracticaModel], { description: 'Listar prácticas' })
  practicas(
    @Args('soloActivas', { nullable: true, defaultValue: false })
    soloActivas: boolean,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.PRACTICA_LISTAR, {
      soloActivas,
    });
  }

  @Query(() => PracticaModel, { description: 'Obtener una práctica' })
  practica(@Args('id', { type: () => ID }) id: string) {
    return this.cuidados.send(CUIDADOS_PATTERNS.PRACTICA_OBTENER, { id });
  }

  @Mutation(() => PracticaModel)
  @Roles(Rol.ADMIN)
  crearPractica(@Args('input') input: CrearPracticaInput) {
    return this.cuidados.send(CUIDADOS_PATTERNS.PRACTICA_CREAR, input);
  }

  @Mutation(() => PracticaModel)
  @Roles(Rol.ADMIN)
  actualizarPractica(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: ActualizarPracticaInput,
  ) {
    return this.cuidados.send(CUIDADOS_PATTERNS.PRACTICA_ACTUALIZAR, {
      id,
      cambios: input,
    });
  }

  @Mutation(() => PracticaModel, {
    description: 'Elimina una práctica que no esté en uso',
  })
  @Roles(Rol.ADMIN)
  eliminarPractica(@Args('id', { type: () => ID }) id: string) {
    return this.cuidados.send(CUIDADOS_PATTERNS.PRACTICA_ELIMINAR, { id });
  }
}

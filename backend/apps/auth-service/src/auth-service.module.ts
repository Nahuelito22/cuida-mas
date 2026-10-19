import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { RpcLoggingInterceptor } from '@app/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { Usuario, UsuarioSchema } from './usuarios/usuario.schema';
import { UsuariosService } from './usuarios/usuarios.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'AUTH_MONGO_URI',
          'mongodb://localhost:27030/cuidamas_auth',
        ),
      }),
    }),
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(config.get('JWT_EXPIRES_IN_SECONDS', 28800)),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsuariosService,
    { provide: APP_INTERCEPTOR, useClass: RpcLoggingInterceptor },
  ],
})
export class AuthServiceModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailModule } from '../../common/email/email.module';
import { TownsModule } from '../towns/towns.module';
import { Resident, ResidentSchema } from './resident.schema';
import { ResidentPortalController } from './resident-portal.controller';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Resident.name, schema: ResidentSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.expiresIn') as any },
      }),
    }),
    EmailModule,
    TownsModule,
  ],
  providers: [ResidentsService],
  controllers: [ResidentsController, ResidentPortalController],
  exports: [ResidentsService],
})
export class ResidentsModule {}

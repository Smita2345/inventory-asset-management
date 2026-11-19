import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset, AssetAssignment, Employee } from './entities.js';
import { AssetsService } from './assets.service.js';
import { AssetsController } from './assets.controller.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'postgres',
      password: 'newpassword123',
      database: 'asset-db',
      entities: [Asset, Employee, AssetAssignment],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Asset, Employee, AssetAssignment]),
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AppModule {}
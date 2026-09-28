import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ImagesController } from './images.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'IMAGE_QUEUE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'image_resize',
          queueOptions: { durable: true },
          persistent: true,
        },
      },
    ]),
  ],
  controllers: [ImagesController],
  providers: [],
})
export class AppModule {}

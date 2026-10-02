import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ImagesService } from './images.service';
import type { ImageStatus } from './image-status';

@Controller()
export class StatusController {
  private readonly logger = new Logger(StatusController.name);

  constructor(private readonly imagesService: ImagesService) {}

  @EventPattern<string>('image_status')
  handleStatus(@Payload() status: ImageStatus, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      this.imagesService.setStatus(status);
      this.logger.log(`Job ${status.id} is ${status.status}`);
    } finally {
      channel.ack(message);
    }
  }
}

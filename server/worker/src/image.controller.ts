import { Controller, Logger } from '@nestjs/common';
import { ImageService } from './image.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { ImageJob } from './image-job';

@Controller()
export class ImageController {
  private readonly logger = new Logger(ImageController.name);

  constructor(private readonly imageService: ImageService) {}

  @EventPattern<string>('image_resize')
  async handleResize(@Payload() job: ImageJob, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      const output = await this.imageService.resize(job);
      this.logger.log(`Job ${job.id} done: ${output}`);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error}`);
    } finally {
      channel.ack(message);
    }
  }
}

import { Controller, Inject, Logger } from '@nestjs/common';
import { ImageService } from './image.service';
import {
  ClientProxy,
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import type { ImageJob } from './image-job';
import { lastValueFrom } from 'rxjs';
import type { ImageStatus } from './image-status';

@Controller()
export class ImageController {
  private readonly logger = new Logger(ImageController.name);

  constructor(
    private readonly imageService: ImageService,
    @Inject('STATUS_QUEUE') private readonly statusClient: ClientProxy,
  ) {}

  private async sendStatus(status: ImageStatus) {
    await lastValueFrom(this.statusClient.emit('image_status', status));
  }

  @EventPattern<string>('image_resize')
  async handleResize(@Payload() job: ImageJob, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      await this.sendStatus({ id: job.id, status: 'processing' });
      const output = await this.imageService.resize(job);
      await this.sendStatus({ id: job.id, status: 'done', output });
      this.logger.log(`Job ${job.id} done: ${output}`);
    } catch (error) {
      await this.sendStatus({
        id: job.id,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
      this.logger.error(`Job ${job.id} failed: ${error}`);
    } finally {
      channel.ack(message);
    }
  }
}

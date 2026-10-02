import { Injectable } from '@nestjs/common';
import { ImageStatus } from './image-status';

@Injectable()
export class ImagesService {
  private readonly statuses = new Map<string, ImageStatus>();

  setStatus(status: ImageStatus) {
    this.statuses.set(status.id, status);
  }

  getStatus(id: string): ImageStatus | undefined {
    return this.statuses.get(id);
  }
}

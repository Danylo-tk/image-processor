import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { basename, extname, join, parse } from 'path';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { ImageJob } from './image-job';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { ImagesService } from './images.service';
import { STORAGE_DIR } from './storage';

@Controller('images')
export class ImagesController {
  constructor(
    @Inject('IMAGE_QUEUE') private readonly client: ClientProxy,
    private readonly imagesService: ImagesService,
  ) {}

  @Post()
  @HttpCode(202)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(STORAGE_DIR, 'originals'),
        filename: (_req, file, cb) =>
          cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        cb(null, file.mimetype.startsWith('image/')),
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('An image file is required!');
    }

    const job: ImageJob = {
      id: parse(file.filename).name,
      path: file.path,
      width: 300,
    };

    this.imagesService.setStatus({ id: job.id, status: 'queued' });
    try {
      await lastValueFrom(this.client.emit('image_resize', job));
    } catch (error) {
      this.imagesService.setStatus({
        id: job.id,
        status: 'failed',
        error: 'Could not queue a job.',
      });
      throw new ServiceUnavailableException('Could not queue a job.');
    }

    return { id: job.id, status: 'queued' };
  }

  @Get(':id')
  imageStatus(@Param('id') id: string) {
    const status = this.imagesService.getStatus(id);

    if (!status) {
      throw new NotFoundException(`Image ${id} not found.`);
    }

    const { output, ...rest } = status;

    if (!output) {
      return rest;
    }

    return { ...rest, url: `/files/${basename(output)}` };
  }
}

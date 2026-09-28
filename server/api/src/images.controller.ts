import {
  BadRequestException,
  Controller,
  HttpCode,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join, parse, resolve } from 'path';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { ImageJob } from './image-job';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

const STORAGE_DIR =
  process.env.STORAGE_DIR ?? resolve(process.cwd(), '../../storage');

@Controller('images')
export class ImagesController {
  constructor(@Inject('IMAGE_QUEUE') private readonly client: ClientProxy) {}

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
    await lastValueFrom(this.client.emit('image_resize', job));

    return { id: job.id, status: 'queued' };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ImageJob } from './image-job';
import sharp from 'sharp';
import { join, resolve } from 'path';

const STORAGE_DIR =
  process.env.STORAGE_DIR ?? resolve(process.cwd(), '../../storage');

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  async resize(job: ImageJob): Promise<string> {
    const outputPath = join(
      STORAGE_DIR,
      'resized',
      `${job.id}_${job.width}.jpg`,
    );

    this.logger.log(`Resizing ${job.path} -> ${outputPath}`);

    await sharp(job.path)
      .resize({ width: job.width, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    return outputPath;
  }
}

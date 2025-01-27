import { Injectable, ExecutionContext } from '@nestjs/common';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class ImageFileInterceptor {
  static getInterceptor(folder: string) {
    const destination = ImageFileInterceptor.getFolder(folder);

    return FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, destination);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${randomUUID()}${path.extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file) {
          return cb(new Error('No file provided'), false);
        }
        cb(null, true);
      },
    });
  }

  private static getFolder(folder: string): string {
    const folderMapping: Record<string, string> = {
      logo: 'uploads/logo',
      product: 'uploads/product',
    };
    return folderMapping[folder] || folderMapping.default;
  }
}

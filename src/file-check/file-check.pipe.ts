import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

interface FileValidationOptions {
  maxSize?: number; // Maximum file size in bytes
  allowedMimes?: string[]; // List of allowed MIME types
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly maxSize: number;
  private readonly allowedMimes: string[];

  constructor(options: FileValidationOptions = {}) {
    this.maxSize = options.maxSize || 5 * 1024 * 1024; // Default max size is 5 MB
    this.allowedMimes = options.allowedMimes || [
      'image/jpeg',
      'image/png',
      'image/gif',
    ]; // Default MIME types
  }

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    // Validate file size
    if (file.size > this.maxSize) {
      throw new BadRequestException(
        `File size exceeds the limit of ${this.maxSize / 1024 / 1024} MB.`,
      );
    }

    // Validate MIME type
    if (!this.allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimes.join(', ')}`,
      );
    }

    return file;
  }
}

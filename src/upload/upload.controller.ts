import {
  Controller,
  Delete,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { join } from 'path';
import { FileValidationPipe } from 'src/file-check/file-check.pipe';
import { CustomResponse } from 'src/http-exception/dto/custom-response.dto';
import { ImageFileInterceptor } from 'src/image-file/image-file.interceptor';
import * as fs from 'fs';

@Controller('')
export class UploadController {
  @Post('upload-logo')
  @UseInterceptors(ImageFileInterceptor.getInterceptor('logo'))
  uploadFile(
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 2 * 1024 * 1024, //2mb
        allowedMimes: ['image/jpeg', 'image/png', 'image/jpg'], // only allow JPG/JPEG and PNG
      }),
    )
    file: Express.Multer.File,
  ) {
    console.log('file', file);
    if (!file) {
      return CustomResponse.error('Unknown Error occurred!', [], 400);
    }
    return CustomResponse.success('File uploaded successfully', file);
  }

  @Delete('delete-image')
  deleteImage(@Query('url') url: string) {
    try {
      const filePath = join(__dirname, '../../', url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true, message: 'File deleted successfully.' };
      }
      return { success: false, message: 'File not found.' };
    } catch (error) {
      return { success: false, message: 'File deletion failed.', error };
    }
  }
}

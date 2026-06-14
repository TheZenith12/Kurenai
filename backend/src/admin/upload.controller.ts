import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const ALLOWED_TYPES = /\.(jpg|jpeg|png|webp|gif)$/i;
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

// Ensure uploads directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('Upload - Зураг upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_TYPES.test(extname(file.originalname))) {
          return cb(new BadRequestException('Зөвхөн JPG, PNG, WebP, GIF зургийг upload хийх боломжтой'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл олдсонгүй');
    const url = `/uploads/${file.filename}`;
    return { url, filename: file.filename, size: file.size };
  }
}

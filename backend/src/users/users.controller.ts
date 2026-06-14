import { Controller, Get, Post, Delete, Patch, Body, Query, UseGuards, Req, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users - Хэрэглэгчид')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: any) { return this.usersService.getProfile(req.user.id); }

  @Get('search')
  search(@Query('q') q: string) { return this.usersService.searchUsers(q); }

  @Get(':id')
  getProfile(@Param('id') id: string) { return this.usersService.getProfile(id); }

  @Patch('me')
  updateMe(@Req() req: any, @Body() body: { displayName?: string; avatarUrl?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  // ─── Watchlist ───────────────────────────────────────────────────────

  @Get('me/watchlist')
  getWatchlist(@Req() req: any) { return this.usersService.getWatchlist(req.user.id); }

  @Post('me/watchlist')
  @HttpCode(HttpStatus.OK)
  addToWatchlist(@Req() req: any, @Body() body: { animeId: string; status?: string }) {
    return this.usersService.upsertWatchlist(req.user.id, body.animeId, body.status);
  }

  @Delete('me/watchlist/:animeId')
  @HttpCode(HttpStatus.OK)
  removeFromWatchlist(@Req() req: any, @Param('animeId') animeId: string) {
    return this.usersService.removeFromWatchlist(req.user.id, animeId);
  }

  // ─── Push tokens ─────────────────────────────────────────────────────

  @Post('me/push-token')
  @HttpCode(HttpStatus.OK)
  savePushToken(@Req() req: any, @Body() body: { token: string }) {
    return this.usersService.savePushToken(req.user.id, body.token);
  }
}

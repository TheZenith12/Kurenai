import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { SeasonsService } from '../seasons/seasons.service';
import { UserRole } from '../common/enums';

@ApiTags('Admin Panel - Хянах самбар')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly seasonsService: SeasonsService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string, @Query('status') status?: string) {
    return this.adminService.getAllUsers(+page, +limit, search, status);
  }

  @Post('ban')
  banUser(@Req() req: any, @Body() body: { userId: string; reason: string; durationHours?: number }) {
    return this.adminService.banUser(req.user.id, body.userId, body.reason, body.durationHours);
  }

  @Post('unban')
  unbanUser(@Req() req: any, @Body() body: { userId: string }) {
    return this.adminService.unbanUser(req.user.id, body.userId);
  }

  @Get('payments/pending')
  getPendingPayments() {
    return this.adminService.getPendingBankTransfers();
  }

  @Post('payments/:id/verify')
  verifyPayment(@Req() req: any, @Param('id') id: string) {
    return this.adminService.verifyBankTransfer(req.user.id, id);
  }

  @Post('payments/:id/reject')
  rejectPayment(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.adminService.rejectBankTransfer(req.user.id, id, body.reason);
  }

  @Post('characters/unlock')
  unlockCharacter(@Req() req: any, @Body() body: { userId: string; characterId: string }) {
    return this.adminService.manualUnlockCharacter(req.user.id, body.userId, body.characterId);
  }

  @Delete('characters/revoke')
  revokeCharacter(@Req() req: any, @Body() body: { userId: string; characterId: string }) {
    return this.adminService.revokeCharacter(req.user.id, body.userId, body.characterId);
  }

  @Patch('characters/:id/price')
  updatePrice(@Req() req: any, @Param('id') id: string, @Body() body: { price: number }) {
    return this.adminService.updateCharacterPrice(req.user.id, id, body.price);
  }

  @Get('reports')
  getReports() {
    return this.adminService.getPendingReports();
  }

  @Post('reports/:id/resolve')
  resolveReport(@Req() req: any, @Param('id') id: string, @Body() body: { action: 'resolve' | 'dismiss'; notes?: string }) {
    return this.adminService.resolveReport(req.user.id, id, body.action, body.notes);
  }

  @Delete('messages/:id')
  deleteMessage(@Req() req: any, @Param('id') id: string) {
    return this.adminService.deleteMessage(req.user.id, id);
  }

  @Get('metrics')
  getMetrics() {
    return this.adminService.getServerMetrics();
  }

  // ─── Anime CRUD ────────────────────────────────────────────────────

  @Get('anime')
  getAllAnimes() {
    return this.adminService.getAllAnimesAdmin();
  }

  @Post('anime')
  createAnime(@Body() body: {
    name: string;
    description: string;
    imageUrl: string;
    bannerUrl?: string;
    sortOrder?: number;
  }) {
    return this.adminService.createAnime(body);
  }

  @Patch('anime/:id')
  updateAnime(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateAnime(id, body);
  }

  @Delete('anime/:id')
  deleteAnime(@Param('id') id: string) {
    return this.adminService.deleteAnime(id);
  }

  // ─── Character CRUD ────────────────────────────────────────────────

  @Post('anime/:animeId/characters')
  createCharacter(@Param('animeId') animeId: string, @Body() body: any) {
    return this.adminService.createCharacter(animeId, body);
  }

  @Patch('characters/:id')
  updateCharacter(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateCharacter(id, body);
  }

  @Delete('characters/:id')
  deleteCharacter(@Param('id') id: string) {
    return this.adminService.deleteCharacter(id);
  }

  // ─── Skill CRUD ────────────────────────────────────────────────────

  @Post('characters/:characterId/skills')
  createSkill(@Param('characterId') characterId: string, @Body() body: any) {
    return this.adminService.createSkill(characterId, body);
  }

  @Delete('skills/:id')
  deleteSkill(@Param('id') id: string) {
    return this.adminService.deleteSkill(id);
  }

  // ─── Season ────────────────────────────────────────────────────────

  @Post('season/start')
  startSeason() {
    return this.seasonsService.createAndActivateSeason();
  }

  @Post('season/end')
  endSeason() {
    return this.seasonsService.finalizeCurrentSeason();
  }
}

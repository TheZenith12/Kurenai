import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CharactersService } from './characters.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Characters - Anime Дүрүүд')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get('animes')
  @Public()
  getAnimes() {
    return this.charactersService.getAllAnimes(false);
  }

  @Get('animes/:animeId')
  @Public()
  getAnime(@Param('animeId') animeId: string) {
    return this.charactersService.getAnimeWithCharacters(animeId);
  }

  @Get('my')
  getMyCharacters(@Req() req: any) {
    return this.charactersService.getUserCharacters(req.user.id);
  }

  @Post('select-free')
  selectFree(@Req() req: any, @Body() body: { characterId: string }) {
    return this.charactersService.selectFreeCharacter(req.user.id, body.characterId);
  }

  @Post('set-active')
  setActive(@Req() req: any, @Body() body: { userCharacterId: string }) {
    return this.charactersService.setActiveCharacter(req.user.id, body.userCharacterId);
  }

  @Post('buy-with-points')
  buyWithPoints(@Req() req: any, @Body() body: { characterId: string }) {
    return this.charactersService.purchaseWithCharacterPoints(req.user.id, body.characterId);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../constants/enums';
import { FollowUpsService } from './follow-ups.service';

@Controller('follow-ups')
export class FollowUpsController {
  constructor(private followUps: FollowUpsService) {}

  @Get('candidate/:candidateId')
  findByCandidate(@Param('candidateId') candidateId: string) {
    return this.followUps.findByCandidate(+candidateId);
  }

  @Post()
  @Roles(UserRole.HR, UserRole.ADMIN, UserRole.HIRING_MANAGER)
  create(@Body() body: any, @Req() req: any) {
    return this.followUps.create(body, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.HR, UserRole.ADMIN, UserRole.HIRING_MANAGER, UserRole.INTERVIEWER)
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.followUps.update(+id, body, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.HR, UserRole.ADMIN, UserRole.HIRING_MANAGER)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.followUps.remove(+id, req.user);
  }
}

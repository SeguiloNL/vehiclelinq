import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import type { UserAccount } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersService } from './users.service';

@Controller('api/v1')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get('companies/:companyId/users')
  list(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
  ): Promise<UserAccount[]> {
    return this.usersService.list(user, companyId);
  }

  @Post('companies/:companyId/users')
  create(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
    @Body()
    body: {
      displayName: string;
      email: string;
      password: string;
      role: UserAccount['role'];
    },
  ): Promise<UserAccount> {
    return this.usersService.create(user, companyId, body);
  }
}

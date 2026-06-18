import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenExpiredError } from 'jsonwebtoken';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Ontbrekende bearer token.');
    }

    const token = header.replace('Bearer ', '');
    try {
      request.user = this.authService.verifyAccessToken(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Sessie verlopen. Log opnieuw in.');
      }

      throw new UnauthorizedException('Ongeldige sessie.');
    }

    request.user.id = request.user.sub;
    return true;
  }
}

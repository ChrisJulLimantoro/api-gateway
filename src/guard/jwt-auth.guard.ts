import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('AUTH') private readonly authClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const [_, service, action, id, subAction, subId, ...remainingPath] =
      request.url.split('/');
    const { method, body } = request;
    const cmd = `${method.toLowerCase()}:${action.toLowerCase()}${id ? '/*' : ''}${subAction ? '/' + subAction.toLowerCase() : ''}${subId ? '/*' : ''}`;

    if (!token) {
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET_KEY,
      });

      // Attach the user object to the request.params
      request.params.user = payload;

      // Check if the user has the required role
      const authorized = await this.authClient
        .send({ cmd: 'authorize' }, { ...payload, ...body, cmd })
        .toPromise();
      if (!authorized) {
        return false;
      }
    } catch (e) {
      throw new UnauthorizedException('Unauthorized');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

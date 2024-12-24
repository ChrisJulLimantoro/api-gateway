import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AppService {
  constructor(private readonly jwtService: JwtService) {}
  async generateToken(payload: { userId: string; email: string }) {
    const accessToken = await this.jwtService.signAsync(payload);

    return accessToken;
  }
}

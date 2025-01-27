import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AppService {
  constructor(private readonly jwtService: JwtService) {}
  async generateToken(payload: {
    id: string;
    email: string;
    company: string[];
    store: string[];
  }) {
    const accessToken = await this.jwtService.signAsync({
      id: payload.id,
      email: payload.email,
      timestamp: new Date().toISOString(),
    });

    return accessToken;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Hardcoded admin for boilerplate — replace with DB lookup
const ADMIN = { id: 'admin', username: 'admin', password: 'admin123', role: 'admin' };

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(username: string, password: string) {
    if (username !== ADMIN.username || password !== ADMIN.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: ADMIN.id, username: ADMIN.username, role: ADMIN.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }
}

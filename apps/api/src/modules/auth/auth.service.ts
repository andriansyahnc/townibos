import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { AdminUser, AdminUserDocument } from './admin-user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(AdminUser.name) private adminModel: Model<AdminUserDocument>,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.adminModel.findOne({ username, isActive: true }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
      townId: user.townId ? user.townId.toString() : null,
    };

    return { access_token: this.jwtService.sign(payload) };
  }

  async createAdmin(dto: { username: string; password: string; role: string; townId?: string }) {
    const hash = await bcrypt.hash(dto.password, 10);
    return this.adminModel.create({ ...dto, password: hash });
  }

  async changePassword(userId: string, newPassword: string) {
    if (!newPassword) throw new BadRequestException('newPassword is required');
    const hash = await bcrypt.hash(newPassword, 10);
    return this.adminModel.findByIdAndUpdate(
      userId,
      { password: hash },
      { returnDocument: 'after' },
    );
  }

  async changePasswordByUsername(username: string, newPassword: string) {
    if (!newPassword) throw new BadRequestException('newPassword is required');
    const user = await this.adminModel.findOne({ username }).select('+password');
    if (!user) throw new UnauthorizedException(`User "${username}" not found`);
    const hash = await bcrypt.hash(newPassword, 10);
    return this.adminModel.findByIdAndUpdate(
      user._id,
      { password: hash },
      { returnDocument: 'after' },
    );
  }
}

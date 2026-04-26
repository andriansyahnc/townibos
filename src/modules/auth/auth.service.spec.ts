import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AdminUser } from './admin-user.schema';
import { AuthService } from './auth.service';

const mockAdminUser = {
  _id: 'user-id-1',
  username: 'admin1',
  password: bcrypt.hashSync('secret', 1),
  role: 'admin',
  townId: 'town-id-1',
  isActive: true,
};

const mockModel = {
  findOne: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(AdminUser.name), useValue: mockModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns an access token for valid credentials', async () => {
      mockModel.findOne.mockResolvedValue(mockAdminUser);

      const result = await service.login('admin1', 'secret');

      expect(result).toEqual({ access_token: 'signed-token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockAdminUser._id,
        username: mockAdminUser.username,
        role: mockAdminUser.role,
        townId: mockAdminUser.townId,
      });
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockModel.findOne.mockResolvedValue(mockAdminUser);

      await expect(service.login('admin1', 'wrongpass')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      await expect(service.login('nobody', 'any')).rejects.toThrow(UnauthorizedException);
    });

    it('includes null townId in token for superadmin', async () => {
      const superadmin = { ...mockAdminUser, role: 'superadmin', townId: null };
      mockModel.findOne.mockResolvedValue(superadmin);

      await service.login('superadmin', 'secret');

      expect(mockJwtService.sign).toHaveBeenCalledWith(expect.objectContaining({ townId: null }));
    });
  });

  describe('createAdmin', () => {
    it('hashes the password before storing', async () => {
      mockModel.create.mockResolvedValue({ username: 'newadmin' });

      await service.createAdmin({ username: 'newadmin', password: 'plaintext', role: 'admin' });

      const stored = mockModel.create.mock.calls[0][0];
      expect(stored.password).not.toBe('plaintext');
      expect(bcrypt.compareSync('plaintext', stored.password)).toBe(true);
    });
  });
});

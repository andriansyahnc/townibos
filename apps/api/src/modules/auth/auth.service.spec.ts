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

const selectMock = jest.fn();
const mockModel = {
  findOne: jest.fn().mockReturnValue({ select: selectMock }),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
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
    // Re-wire chain after clearAllMocks resets mockReturnValue
    mockModel.findOne.mockReturnValue({ select: selectMock });
  });

  describe('login', () => {
    it('returns an access token for valid credentials', async () => {
      selectMock.mockResolvedValue(mockAdminUser);

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
      selectMock.mockResolvedValue(mockAdminUser);

      await expect(service.login('admin1', 'wrongpass')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      selectMock.mockResolvedValue(null);

      await expect(service.login('nobody', 'any')).rejects.toThrow(UnauthorizedException);
    });

    it('includes null townId in token for superadmin', async () => {
      const superadmin = { ...mockAdminUser, role: 'superadmin', townId: null };
      selectMock.mockResolvedValue(superadmin);

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

  describe('changePassword', () => {
    it('hashes the new password and updates the user', async () => {
      mockModel.findByIdAndUpdate.mockResolvedValue({ _id: 'user-id-1' });

      await service.changePassword('user-id-1', 'newpassword');

      const [id, update] = mockModel.findByIdAndUpdate.mock.calls[0];
      expect(id).toBe('user-id-1');
      expect(update.password).not.toBe('newpassword');
      expect(bcrypt.compareSync('newpassword', update.password)).toBe(true);
    });
  });

  describe('changePasswordByUsername', () => {
    it('finds user by username and updates the password', async () => {
      selectMock.mockResolvedValue({ ...mockAdminUser, _id: 'user-id-1' });
      mockModel.findByIdAndUpdate.mockResolvedValue({ _id: 'user-id-1' });

      await service.changePasswordByUsername('admin1', 'newpassword');

      expect(mockModel.findOne).toHaveBeenCalledWith({ username: 'admin1' });
      const [, update] = mockModel.findByIdAndUpdate.mock.calls[0];
      expect(bcrypt.compareSync('newpassword', update.password)).toBe(true);
    });

    it('throws UnauthorizedException when username not found', async () => {
      selectMock.mockResolvedValue(null);

      await expect(service.changePasswordByUsername('nobody', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

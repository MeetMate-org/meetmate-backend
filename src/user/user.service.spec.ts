import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User } from './user.schema';

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken('User'), // Mock the UserModel
          useValue: {
            findById: jest.fn(), // Mocked methods
            findOne: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService); // Get the UserService instance
    userModel = module.get<Model<User>>(getModelToken('User')); // Get the mocked UserModel
  });

  describe('getUserById', () => {
    it('should return user data when user exists', async () => {
      const mockUser = {
        _id: '680cb40e298cd5974ddebc73',
        username: 'gtxtab',
        email: 'test@gmail.com',
        password: '$2b$10$wG.JJRhT8izXGkiVaG2P7.JfPxw5ByTFXx03NuaGPzb/jlSGLenxW',
        isVerified: true,
        otpSecret: '',
        accessKey: '5ac9df24ca06d8e36a255b607894ab263388f0cd687dfbbdb4d68fea1aa01b05',
        createdAt: new Date('2025-04-26T10:23:10.955Z'),
        __v: 0,
      };

      jest.spyOn(userModel, 'findById').mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValueOnce(mockUser),
        }),
      } as any);

      const result = await service.getUserById('validId');
      console.log('Result:', result);
      
      // Adjust the expected result to match the transformation logic in getUserById
      expect(result).toEqual({
        username: 'gtxtab', // Matches mockUser.username
        email: 'test@gmail.com', // Matches mockUser.email
        avatar: undefined, // Add this if the service adds an avatar field
        createdAt: mockUser.createdAt, // Matches mockUser.createdAt
      });

      expect(userModel.findById).toHaveBeenCalledWith('validId');
    });
  });
});
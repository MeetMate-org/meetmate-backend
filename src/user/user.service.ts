import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  createUser() {
   console.log('User created');
   return { message: 'User created' };
  }
}

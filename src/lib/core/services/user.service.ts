import { User } from '../types';
import { userRepository } from '../repositories';

export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getCurrentUser(): Promise<User | null> {
    return userRepository.getCurrentUser();
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User | null> {
    return userRepository.updateProfile(userId, data);
  }

  async signIn(email: string, password: string) {
    return userRepository.signIn(email, password);
  }

  async signUp(email: string, password: string) {
    return userRepository.signUp(email, password);
  }

  async signOut() {
    return userRepository.signOut();
  }
}

export const userService = UserService.getInstance();
import BaseRepository from './base.repository';
import { User, IUser } from '../models/user.model';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email });
  }

  async findByVerificationToken(token: string): Promise<IUser | null> {
    return this.findOne({ emailVerificationToken: token });
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    return this.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
  }
}

export const userRepository = new UserRepository();
export default userRepository;

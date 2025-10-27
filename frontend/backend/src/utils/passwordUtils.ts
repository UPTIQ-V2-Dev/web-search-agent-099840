import bcrypt from 'bcryptjs';
import { config } from '@/config';

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, config.security.bcryptRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

export const isValidPassword = (password: string): boolean => {
    // Password must be at least 8 characters long and contain:
    // - At least one lowercase letter
    // - At least one uppercase letter
    // - At least one digit
    // - At least one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

import dotenv from 'dotenv'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserPayload } from 'types/User';

//Password Hashing
export const hashPassword = async(password:string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

//Password compare
export const comparePassword = async(enteredPassword: string, storedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(enteredPassword,storedPassword);
};


//jwt

export const generateToken = (user: UserPayload) => {
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, {
        expiresIn: '2h',
    });


    return token;  
};
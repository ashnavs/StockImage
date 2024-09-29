import { Request } from 'express';
import { FileArray } from 'multer';


export interface MulterRequest extends Request {
    files?: FileArray; 
    user?: {
        id: string;
        email?: string; 
    };
}

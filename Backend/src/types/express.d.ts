import { Request } from 'express';
import { UserPayload } from '../types/User'; 

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload; 
        }
    }
}

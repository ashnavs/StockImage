import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../types/User'; 

interface RequestWithUser extends Request {
    user?: UserPayload;
}

const authenticateToken = (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
        if (err) {
            return res.sendStatus(403); 
        }
        
        req.user = user as UserPayload;
        next(); 
    });
};

export default authenticateToken;

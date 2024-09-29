import { Router } from "express";
import authController from "../controllers/authController";
import multer from 'multer'
import authenticateToken from "../middleware/authMiddleware";


const userRoute = Router();
const upload = multer(); 

userRoute.post('/signup',authController.userRegistration)
userRoute.post('/login',authController.userLogin)
userRoute.post('/verifyotp',authController.verifyOtp)
userRoute.post('/upload',authenticateToken, upload.array('images'),authController.bulkImageUpload);
userRoute.get('/images/:userId',authController.fetchImages)
userRoute.put('/update-order',authController.updateImageOrder)
userRoute.delete('/delete/:imageId',authController.deleteImage)
userRoute.put('/update/:imageId', upload.single('file'),authController.updateImage)

export default userRoute;
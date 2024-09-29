import { Request, Response } from "express";
import { validationResult } from "express-validator";
import User, {IUser} from "../models/User";
import { hashPassword, comparePassword, generateToken } from "../config/authUtils";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { uploadToS3 } from "../config/s3Uploader";
import { MulterRequest } from "../config/multer";
import Image from "../models/Image";
import { UserPayload } from "types/User";
import { deleteFromS3 } from "../config/s3Uploader";

interface ReorderedImage {
    _id: string;
    order: number;
  }


interface UpdateImageData {
    title: string;
    imageUrl?: string;  
  }
  

interface ReorderImagesRequestBody {
    reorderedImages: ReorderedImage[];
  }
  

export default{
    userRegistration: async(req:Request, res:Response) => {
        try {
            console.log(req.body);
            const {  firstName , lastName, email, password, phone} = req.body
            
            let userExist = await User.findOne({email});
            if(userExist){
                return res.status(400).json({ msg: "User already exists" });
            }

            const hashedPassword = await hashPassword(password);

            const otp = crypto.randomInt(100000 , 999999).toString();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

            const newUser = new User({
                name: firstName +' '+lastName,
                email,
                password:hashedPassword,
                phone,
                otp,
                otpExpires,
            });

            await newUser.save();


            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
            };

            await transporter.sendMail(mailOptions);

            res.status(201).json({ msg: "User registered successfully", user: newUser });
        } catch (error:any) {
            console.error(error.message)
            res.status(500).json({ error: error.message })
      
        }
    },
    verifyOtp:async (req:Request, res:Response) => {
        try {
            const {userId , otp} = req.body;
            console.log(`OTP:${otp}`)

            const user = await User.findById(userId);
            if(!user){
                return res.status(400).json({ msg: 'User not found' });
            }

            if (!user.otp || !user.otpExpires) {
                return res.status(400).json({ msg: 'OTP not set or already verified' });
            }

             if (user.otp !== otp || new Date() > user.otpExpires) {
                return res.status(400).json({ msg: 'Invalid or expired OTP' });
            }

            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();

            res.status(200).json({ msg: 'OTP verified successfully' });
        } catch (error:any) {
            console.error(error.message);
            res.status(500).json({ error: error.message });
        }
    },
   userLogin: async (req: Request, res: Response) => {
        try {
            console.log('login', req.body);
            const { email, password } = req.body;

            const user: IUser | null = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ msg: 'Invalid email or password' });
            }

            const isMatch = await comparePassword(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid password' });
            }
            const userPayload: UserPayload = {
                id: user.id.toString(), 
                email: user.email,
            };

            const token = generateToken(userPayload); 

            res.status(200).json({
                msg: 'Login successful',
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                }
            });
        } catch (error: any) {
            console.error(error.message);
            res.status(500).json({ error: error.message });
        }
    },
    updateImageOrder : async (req: Request, res: Response) => {
        const updatedOrder = req.body;
        console.log('updatedOrder:',updatedOrder) 
      
        try {
          const updatePromises = updatedOrder.map(async (imageData: { _id: string, order: number }) => {
            return await Image.findByIdAndUpdate(imageData._id, { order: imageData.order });
          });
      
          await Promise.all(updatePromises);
      
          return res.status(200).json({ message: 'Image order updated successfully' });
        } catch (error) {
          console.error('Error updating image order:', error);
          return res.status(500).json({ error: 'Failed to update image order' });
        }
      },
      
    bulkImageUpload: async (req: MulterRequest, res: Response) => {
        if (!req.files) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
    
        const fileArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    
        if (fileArray.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
    
        const { titles } = req.body; 
    
        if (!titles || !Array.isArray(titles) || titles.length !== fileArray.length) {
            return res.status(400).json({ error: 'Titles are missing or do not match the number of files' });
        }
    
        try {
            const userId = req.user?.id;
    
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
    
            const existingImages = await Image.find({ user: userId }).sort({ order: -1 });
            let currentOrder = existingImages.length > 0 ? existingImages[0].order + 1 : 0;
    
            const uploadResults = await Promise.all(
                fileArray.map(async (file, index) => {
                    const result = await uploadToS3(file);
                    return {
                        title: titles[index],
                        imageUrl: result.Location,
                        order: currentOrder++, 
                        user: userId,
                    };
                })
            );
    
            const savedImages = await Image.insertMany(uploadResults);
    
            res.status(200).json({ images: savedImages });
        } catch (error) {
            console.error('Error uploading images:', error);
            res.status(500).json({ error: 'Error uploading images' });
        }
    },
    
    
    fetchImages: async(req:Request, res: Response) => {
        const userId = req.params.userId; 
        console.log(userId)
    try {
        const images = await Image.find({ user: userId }).sort({ order: 1 });
        res.status(200).json(images);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching images' });
        }
    },
    deleteImage: async (req: Request, res: Response) => {
        try {
          const { imageId } = req.params;
    
          const image = await Image.findById(imageId);
          if (!image) {
            return res.status(404).json({ msg: "Image not found" });
          }
    
          await deleteFromS3(image.imageUrl);
    
          await Image.findByIdAndDelete(imageId);
    
          res.status(200).json({ msg: "Image deleted successfully" });
        } catch (error: any) {
          console.error("Error deleting image:", error.message);
          res.status(500).json({ error: error.message });
        }
      },
      updateImage:async (req: Request, res: Response) => {
        const { title } = req.body;
        const file = req.file;
      
        try {
          const updatedData: { title: string; imageUrl?: string } = { title };
      
          if (file) {
            const uploadResult = await uploadToS3(file);
            updatedData.imageUrl = uploadResult.Location;
          }
      
          const updatedImage = await Image.findByIdAndUpdate(
            req.params.imageId,
            updatedData,
            { new: true }
          );
      
          if (!updatedImage) {
            return res.status(404).json({ error: 'Image not found' });
          }
      
          res.json(updatedImage);
        } catch (error) {
          res.status(500).json({ error: 'Server error' });
        }
    }
      
}
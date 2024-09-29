"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const authUtils_1 = require("../config/authUtils");
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const s3Uploader_1 = require("../config/s3Uploader");
const Image_1 = __importDefault(require("../models/Image"));
const s3Uploader_2 = require("../config/s3Uploader");
exports.default = {
    userRegistration: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log(req.body);
            const { firstName, lastName, email, password, phone } = req.body;
            let userExist = yield User_1.default.findOne({ email });
            if (userExist) {
                return res.status(400).json({ msg: "User already exists" });
            }
            const hashedPassword = yield (0, authUtils_1.hashPassword)(password);
            const otp = crypto_1.default.randomInt(100000, 999999).toString();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
            const newUser = new User_1.default({
                name: firstName + ' ' + lastName,
                email,
                password: hashedPassword,
                phone,
                otp,
                otpExpires,
            });
            yield newUser.save();
            const transporter = nodemailer_1.default.createTransport({
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
            yield transporter.sendMail(mailOptions);
            res.status(201).json({ msg: "User registered successfully", user: newUser });
        }
        catch (error) {
            console.error(error.message);
            res.status(500).json({ error: error.message });
        }
    }),
    verifyOtp: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { userId, otp } = req.body;
            console.log(`OTP:${otp}`);
            const user = yield User_1.default.findById(userId);
            if (!user) {
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
            yield user.save();
            res.status(200).json({ msg: 'OTP verified successfully' });
        }
        catch (error) {
            console.error(error.message);
            res.status(500).json({ error: error.message });
        }
    }),
    userLogin: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log('login', req.body);
            const { email, password } = req.body;
            const user = yield User_1.default.findOne({ email });
            if (!user) {
                return res.status(400).json({ msg: 'Invalid email or password' });
            }
            const isMatch = yield (0, authUtils_1.comparePassword)(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid password' });
            }
            const userPayload = {
                id: user.id.toString(),
                email: user.email,
            };
            const token = (0, authUtils_1.generateToken)(userPayload);
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
        }
        catch (error) {
            console.error(error.message);
            res.status(500).json({ error: error.message });
        }
    }),
    updateImageOrder: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedOrder = req.body;
        console.log('updatedOrder:', updatedOrder);
        try {
            const updatePromises = updatedOrder.map((imageData) => __awaiter(void 0, void 0, void 0, function* () {
                return yield Image_1.default.findByIdAndUpdate(imageData._id, { order: imageData.order });
            }));
            yield Promise.all(updatePromises);
            return res.status(200).json({ message: 'Image order updated successfully' });
        }
        catch (error) {
            console.error('Error updating image order:', error);
            return res.status(500).json({ error: 'Failed to update image order' });
        }
    }),
    bulkImageUpload: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
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
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const existingImages = yield Image_1.default.find({ user: userId }).sort({ order: -1 });
            let currentOrder = existingImages.length > 0 ? existingImages[0].order + 1 : 0;
            const uploadResults = yield Promise.all(fileArray.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
                const result = yield (0, s3Uploader_1.uploadToS3)(file);
                return {
                    title: titles[index],
                    imageUrl: result.Location,
                    order: currentOrder++,
                    user: userId,
                };
            })));
            const savedImages = yield Image_1.default.insertMany(uploadResults);
            res.status(200).json({ images: savedImages });
        }
        catch (error) {
            console.error('Error uploading images:', error);
            res.status(500).json({ error: 'Error uploading images' });
        }
    }),
    fetchImages: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = req.params.userId;
        console.log(userId);
        try {
            const images = yield Image_1.default.find({ user: userId }).sort({ order: 1 });
            res.status(200).json(images);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching images' });
        }
    }),
    deleteImage: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { imageId } = req.params;
            const image = yield Image_1.default.findById(imageId);
            if (!image) {
                return res.status(404).json({ msg: "Image not found" });
            }
            yield (0, s3Uploader_2.deleteFromS3)(image.imageUrl);
            yield Image_1.default.findByIdAndDelete(imageId);
            res.status(200).json({ msg: "Image deleted successfully" });
        }
        catch (error) {
            console.error("Error deleting image:", error.message);
            res.status(500).json({ error: error.message });
        }
    }),
    updateImage: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { title } = req.body;
        const file = req.file;
        try {
            const updatedData = { title };
            if (file) {
                const uploadResult = yield (0, s3Uploader_1.uploadToS3)(file);
                updatedData.imageUrl = uploadResult.Location;
            }
            const updatedImage = yield Image_1.default.findByIdAndUpdate(req.params.imageId, updatedData, { new: true });
            if (!updatedImage) {
                return res.status(404).json({ error: 'Image not found' });
            }
            res.json(updatedImage);
        }
        catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    })
};

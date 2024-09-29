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
exports.deleteFromS3 = exports.uploadToS3 = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME, } = process.env;
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_BUCKET_NAME) {
    throw new Error('Missing AWS configuration in .env file');
}
const s3Client = new client_s3_1.S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});
const uploadToS3 = (file) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('File object:', file);
    const sanitizedFileName = ((_a = file.originalname) === null || _a === void 0 ? void 0 : _a.replace(/[^a-zA-Z0-9.]/g, '_')) || 'default_filename';
    const uniqueFileName = `${(0, uuid_1.v4)()}-${sanitizedFileName}`;
    ;
    const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Key: uniqueFileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    try {
        const command = new client_s3_1.PutObjectCommand(uploadParams);
        const data = yield s3Client.send(command);
        console.log('File uploaded successfully:', Object.assign(Object.assign({}, data), { Location: `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${uploadParams.Key}` }));
        return { Location: `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${uploadParams.Key}` };
    }
    catch (error) {
        console.error('Error uploading file to S3:', error);
        throw error;
    }
});
exports.uploadToS3 = uploadToS3;
// Delete function
const deleteFromS3 = (imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = imageUrl.split('/').pop();
        const params = {
            Bucket: AWS_BUCKET_NAME,
            Key: key,
        };
        const command = new client_s3_1.DeleteObjectCommand(params);
        yield s3Client.send(command);
        console.log(`Successfully deleted image from S3: ${imageUrl}`);
    }
    catch (error) {
        console.error(`Error deleting image from S3: ${error.message}`);
        throw new Error('Failed to delete image from S3');
    }
});
exports.deleteFromS3 = deleteFromS3;

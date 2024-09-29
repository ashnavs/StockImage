import dotenv from 'dotenv';
dotenv.config();
import { S3Client, PutObjectCommand,  DeleteObjectCommand  } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_BUCKET_NAME,
} = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_BUCKET_NAME) {
  throw new Error('Missing AWS configuration in .env file');
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<{ Location: string }> => {
 
  
  console.log('File object:', file);

  const sanitizedFileName = file.originalname?.replace(/[^a-zA-Z0-9.]/g, '_') || 'default_filename';
  const uniqueFileName = `${uuidv4()}-${sanitizedFileName}`;;

  const uploadParams = {
    Bucket: AWS_BUCKET_NAME,
    Key: uniqueFileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    const data = await s3Client.send(command);
    console.log('File uploaded successfully:', { ...data, Location: `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${uploadParams.Key}` });
    return { Location: `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${uploadParams.Key}` };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

// Delete function
export const deleteFromS3 = async (imageUrl: string) => {
  try {
    const key = imageUrl.split('/').pop(); 

    const params = {
      Bucket: AWS_BUCKET_NAME, 
      Key: key,
    };

    const command = new DeleteObjectCommand(params); 
    await s3Client.send(command);
    console.log(`Successfully deleted image from S3: ${imageUrl}`);
  } catch (error: any) {
    console.error(`Error deleting image from S3: ${error.message}`);
    throw new Error('Failed to delete image from S3');
  }
};

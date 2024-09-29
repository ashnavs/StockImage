import mongoose, { Document, Schema } from 'mongoose';

interface IImage extends Document {
  title: string;
  imageUrl: string;
  order:number;
  user: mongoose.Types.ObjectId; 
}

const ImageSchema: Schema = new Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  order: { type: Number, required: true },
  user: { type: mongoose.Types.ObjectId, ref: 'User', required: true }, 
});

export default mongoose.model<IImage>('Image', ImageSchema);

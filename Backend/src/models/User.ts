import mongoose, {Document,Schema} from "mongoose";

export interface IUser extends Document {
    name:string;
    email: string;
    password:string;
    phone:string;
    otp?: string;
    otpExpires?: Date;
}

const userSchema = new Schema<IUser>({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    phone:{
        type: String,
        required: true
    },
    otp: { type: String },
    otpExpires: { type: Date },
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
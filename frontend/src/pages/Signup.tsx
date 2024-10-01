
import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import signupimg from '../../src/assets/signup.png';
import { useRegisterUserMutation, useLoginUserMutation, useVerifyOtpMutation } from '../api/authApi'; 
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {  setUser } from '../api/authSlice';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie'; // Import the js-cookie library

interface SignUpFormValues {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    password: string;
}

interface ApiError {
    data?: {
        msg?: string;
    };
}

const isApiError = (error: unknown): error is ApiError => {
    return typeof error === 'object' && error !== null && 'data' in error;
};

const SignUpForm: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch()
    const [isSignIn, setIsSignIn] = useState(false); 
    const [isOtpStep, setIsOtpStep] = useState(false); // State for OTP step
    const [userId, setUserId] = useState<string | null>(null); // Store user ID for OTP verification
    const [otp, setOtp] = useState(''); // State to store OTP
    const [registerUser] = useRegisterUserMutation();
    const [loginUser] = useLoginUserMutation(); 
    const [verifyOtp] = useVerifyOtpMutation(); 
  

    console.log(userId)

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId'); // Retrieve userId from localStorage
        if (storedUserId) {
            setUserId(storedUserId);
        }
    }, []);



    const validationSchema = Yup.object({
        firstName: isSignIn
            ? Yup.string().notRequired()
            : Yup.string()
                .trim()
                .required('First name is required')
                .matches(/^\S+$/, 'First name cannot be empty or contain only spaces'),
        
        lastName: isSignIn
            ? Yup.string().notRequired()
            : Yup.string()
                .trim()
                .required('Last name is required')
                .matches(/^\S+$/, 'Last name cannot be empty or contain only spaces'),
        
        email: Yup.string()
            .trim()
            .email('Invalid email format')
            .required('Email is required'),
        
        phone: isSignIn
            ? Yup.string().notRequired()
            : Yup.string()
                .required('Phone number is required')
                .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
        
        password: Yup.string()
            .trim()
            .min(6, 'Password must be at least 6 characters')
            .required('Password is required')
            .matches(/^\S+$/, 'Password cannot contain only spaces'),
    });
    

 
    

    const formik = useFormik<SignUpFormValues>({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setSubmitting(true);
                if (isSignIn) {
                    const response = await loginUser({ email: values.email, password: values.password }).unwrap();
                    Cookies.set('token', response.token, { expires: 7 }); 
                    dispatch(setUser(response.user)); 
                    localStorage.setItem('userId', response.user._id);
                    console.log('Login Response:', response);
                    toast.success(response.msg);
                    navigate('/home');
                } else if (!isOtpStep) { 
                    const response = await registerUser(values).unwrap();
                    console.log(response.user._id)
                    toast.success(response.msg);
                    setUserId(response.user._id); // Store userId for OTP verification
                    setIsOtpStep(true); // Move to OTP step
                }
            } catch (err: unknown) {
                if (isApiError(err) && err.data?.msg) {
                    toast.error(err.data.msg);
                } else {
                    toast.error('An error occurred');
                }
            } finally {
                setSubmitting(false);
            }
        },
    });

    // Function to handle OTP submission
    const handleOtpSubmit = async () => {
        try {
            const response = await verifyOtp({ userId, otp }).unwrap();
            toast.success(response.msg);
            setIsOtpStep(false);
            setIsSignIn(true); 
        } catch (err: unknown) {
            if (isApiError(err) && err.data?.msg) {
                toast.error(err.data.msg);
            } else {
                toast.error('Invalid OTP or error occurred');
            }
        }
    };

    

    // Modal Component for OTP Input
    const OtpModal = () => (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Enter OTP</h2>
                <input
                    type="text"
                    name="otp"
                    placeholder="Enter OTP"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    onChange={(e) => setOtp(e.target.value)}
                    value={otp}
                />
                <div className="mt-4 space-y-2">
                    <button
                        type="button"
                        className="w-full bg-[#211f60] text-white py-2 rounded-md hover:bg-[#2e2b77]"
                        onClick={handleOtpSubmit}
                    >
                        Submit OTP
                    </button>
                    <button
                        type="button"
                        className="w-full border-2 border-[#211f60] text-[#211f60] py-2 rounded-md hover:bg-gray-100"
                        onClick={() => setIsOtpStep(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
            <div className={`max-w-5xl w-full bg-white shadow-2xl rounded-lg flex flex-col lg:flex-row ${isSignIn ? 'lg:flex-row-reverse' : ''}`}>
                <div
                    className={`hidden lg:block w-full lg:w-1/2 bg-cover bg-center`}
                    style={{
                        backgroundImage: `url(${signupimg})`,
                    }}
                />
                <div className="w-full lg:w-1/2 p-8 lg:p-12">
                    <h2 className="text-3xl font-bold text-[#211f60] text-center mb-6">
                        {isSignIn ? 'Sign In' : 'Create Account'}
                    </h2>
                    <form onSubmit={formik.handleSubmit} className="space-y-4">
                        {!isSignIn && (
                            <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="Your first name"
                                    className="w-full lg:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.firstName}
                                />
                                {formik.touched.firstName && formik.errors.firstName ? (
                                    <div className="text-red-600">{formik.errors.firstName}</div>
                                ) : null}

                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Your last name"
                                    className="w-full lg:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.lastName}
                                />
                                {formik.touched.lastName && formik.errors.lastName ? (
                                    <div className="text-red-600">{formik.errors.lastName}</div>
                                ) : null}
                            </div>
                        )}

                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.email}
                        />
                        {formik.touched.email && formik.errors.email ? (
                            <div className="text-red-600">{formik.errors.email}</div>
                        ) : null}

                        {!isSignIn && (
                            <input
                                type="text"
                                name="phone"
                                placeholder="Enter your phone"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.phone}
                            />
                        )}
                        {formik.touched.phone && formik.errors.phone ? (
                            <div className="text-red-600">{formik.errors.phone}</div>
                        ) : null}

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.password}
                        />
                        {formik.touched.password && formik.errors.password ? (
                            <div className="text-red-600">{formik.errors.password}</div>
                        ) : null}

                        <div className="space-y-2">
                            <button
                                type="submit"
                                className="w-full bg-[#211f60] text-white py-2 rounded-md hover:bg-[#2e2b77]"
                                disabled={formik.isSubmitting}
                            >
                                {formik.isSubmitting ? 'Submitting...' : isSignIn ? 'Sign In' : 'Sign Up'}
                            </button>

                            <button
                                type="button"
                                className="w-full border-2 border-[#211f60] text-[#211f60] py-2 rounded-md hover:bg-gray-100"
                                onClick={() => setIsSignIn(!isSignIn)}
                            >
                                {isSignIn ? 'Create Account' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* OTP Modal */}
            {isOtpStep && <OtpModal />}
        </div>
    );
};

export default SignUpForm;

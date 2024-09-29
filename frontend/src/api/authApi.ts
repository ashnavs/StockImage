import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface ImageUploadResponse {
    images: { title: string; imageUrl: string }[];
}

const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://render.com/docs/web-services#port-binding/' , credentials: 'include' }),
    endpoints: (builder) => ({
        registerUser: builder.mutation({
            query: (userData) => ({
                url: 'users/signup',
                method: 'POST',
                body: userData,
            }),
        }),
        loginUser: builder.mutation({
            query: (userData) => ({
                url: 'users/login',
                method: 'POST',
                body: userData,
            }),
        }),
        verifyOtp: builder.mutation({
            query: (otp) => ({
                url: 'users/verifyotp',
                method: 'POST',
                body: otp,
            }),
        }),
        // Updated uploadImages mutation
        uploadImages: builder.mutation<ImageUploadResponse, { formData: FormData; token?: string }>({
            query: ({ formData, token }) => ({
                url: 'users/upload',
                method: 'POST',
                body: formData,
                headers: {
                    Authorization: `Bearer ${token}`, // Use token from parameters
                },
            }),
        }),
        fetchImages: builder.query<{ _id: string; title: string; imageUrl: string }[], string>({
            query: (userId) => ({
                url: `users/images/${userId}`, // Assume you have a route to get user images
                method: 'GET',
            }),
        }),
        reorderImages: builder.mutation({
            query: (reorderedImages) => ({
              url: 'users/reorder',
              method: 'PUT',
              body: { reorderedImages },
            }),
          }),
    }),
});

export const { useRegisterUserMutation, useLoginUserMutation, useVerifyOtpMutation, useUploadImagesMutation, useFetchImagesQuery, useReorderImagesMutation   } = authApi;

export default authApi;

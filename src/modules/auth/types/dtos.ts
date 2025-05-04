import { UserPublicProps } from "../../user/models/User/usertypes";

export interface LoginRequestDto {
    email: string;
    password: string;
}
export interface LoginResponseDto {
    accessToken: string;
    user:UserPublicProps;
}

export interface TokenResponseDto {
    accessToken: string;
    refreshToken:string;
    user:UserPublicProps;
}

export interface TokenResponseDtoClient {
    accessToken: string; // Only this is sent to the client
}

export interface RegisterRequestDto {
    fname:string;
    lname:string;
    username:string;
    email: string;
    password: string;
    occupation?:string;
}

export interface UserLoggedInResponseDto {
    user:UserPublicProps;
    removeRefreshToken:boolean;  
}

export interface RegisterResponseDto {
    userId:string
}
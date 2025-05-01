export interface LoginRequestDto {
    email: string;
    password: string;
}

export interface TokenResponseDto {
    accessToken: string;
    refreshToken:string;
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


export interface RegisterResponseDto {
    userId:string
}
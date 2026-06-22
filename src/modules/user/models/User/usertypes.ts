export interface UserPublicProps {
    id: string;
    fname: string;
    lname: string;
    username: string;
    email: string;
    credits: number;
    avatar?: string;
}

export interface UserType extends UserPublicProps{
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserDbRow {    
    id: string;
    fname: string;
    lname: string;
    username: string;
    email: string;
    password: string;
    credits: number;
    avatar?: string | null;
    created_at: Date;
    updated_at: Date;
}

  
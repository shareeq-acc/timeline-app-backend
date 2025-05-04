export interface UserPublicProps {
    id: string;
    fname: string;
    lname: string;
    username: string;
    credits: number;
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
    created_at: Date;
    updated_at: Date;
}

  
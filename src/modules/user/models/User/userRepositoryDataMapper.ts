import { UserDbRow, UserPublicProps, UserType } from "./usertypes";

export const mapDbRowToUser = (row: UserDbRow): UserType => { 
    return {
        id: row.id,
        fname: row.fname,
        lname: row.lname,
        username: row.username,
        email: row.email,
        password: row.password,
        credits: row.credits,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
}

export const mapUserToUserResponse = (user: UserType): UserPublicProps => {
    return{
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        username: user.username,
        credits: user.credits,
    }
}
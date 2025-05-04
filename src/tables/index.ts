export interface Table {
    readonly name: string;
    readonly sql: string;
    readonly trigger?: string;
    readonly dummyData?: {
        checkSql: string;
        insertSql: string;
    };
} 
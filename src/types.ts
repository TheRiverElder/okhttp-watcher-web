export interface OkHttpState {
    uid: number;
    request: {
        url: string;
    };
    response: {
        body: {
            charset: string;
            content: Uint8Array;
        },
    };
}
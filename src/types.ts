export interface OkHttpState {
    uid: number;
    request: {
        url: string;
        // headers: object;
        // body?: Uint8Array;
    };
    response: {
        // headers: object;
        body: {
            charset: string;
            content: Uint8Array;
        },
    };
}
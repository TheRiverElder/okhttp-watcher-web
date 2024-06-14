import { Component } from 'react';
import './App.scss'
import { OkHttpState } from './types';
import ByteArrayView from './ByteArrayView';

export interface AppState {
    address: string;
    addressPlaceholder: string;
    connected: boolean;
    okHttpStates: Array<OkHttpState>;
    watchingStateUid: number | null;
}

export default class App extends Component<any, AppState> {

    private websocket: WebSocket | null = null;

    state: Readonly<AppState> = {
        address: "",
        addressPlaceholder: "ws://127.0.0.1:8080/",
        connected: false,
        okHttpStates: createFakeList(),
        watchingStateUid: null,
    };

    render() {

        const s = this.state;

        const okhttpState = s.okHttpStates.find(it => it.uid === s.watchingStateUid);

        return (
            <div className="App">
                <div className="connection">
                    <label className="input-address">
                        <span>请输入服务器地址：</span>
                        <input
                            type="url"
                            placeholder={s.addressPlaceholder}
                            value={s.address}
                            onChange={e => this.setState({ address: e.target.value })}
                        />
                    </label>
                    <div className='buttons'>
                        <span>{s.connected ? "已连接" : "未连接"}</span>
                        <button onClick={(s.connected ? this.disconnectWebSocket : this.connectWebSocket).bind(this)}>{s.connected ? "断开" : "连接"}</button>
                        <button onClick={() => this.setState({ okHttpStates: [] })}>清空</button>
                    </div>
                </div>
                <div className="connection-states">
                    <div className='list'>
                        <div className='info'>
                            <h3>HTTP连接</h3>
                            <div>数量：{s.okHttpStates.length}</div>
                        </div>
                        <ul>
                            {s.okHttpStates.map(hs => (
                                <li
                                    onClick={() => this.setState({ watchingStateUid: hs.uid })}
                                >
                                    <span>{hs.request.url}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {!okhttpState ? null : (
                        <div className='detail'>
                            <div>UID: {okhttpState.uid}</div>
                            <details className='rquest-url'>
                                <summary>Request Url</summary>
                                <div className='content'>
                                    {okhttpState.request.url}
                                </div>
                            </details>
                            <details className='rquest-headers'>
                                <summary>Request Headers</summary>
                                <div className='content'>
                                </div>
                            </details>
                            <details className='response-headers'>
                                <summary>Response Headers</summary>
                                <div className='content'>
                                </div>
                            </details>
                            <details className='response-body-info'>
                                <summary>Response Body Info</summary>
                                <div className='content'>
                                    <span>Charset: </span>
                                    <span>{okhttpState.response.body.charset}</span>
                                </div>
                            </details>
                            <details className='response-body-content-raw'>
                                <summary>Response Body Content Bytes</summary>
                                <div className='content'>
                                    <ByteArrayView byteArray={okhttpState.response.body.content} />
                                </div>
                            </details>
                            <details className='response-body-content-decoded'>
                                <summary>Response Body Content Decoded</summary>
                                <div className='content'>
                                    {decodeContent(okhttpState.response.body.content, okhttpState.response.body.charset)}
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    updateOkHttpState(okHttpState: OkHttpState) {
        const okHttpStates = this.state.okHttpStates.slice();
        const index = okHttpStates.findIndex(it => it.uid === okHttpState.uid);
        if (index < 0) {
            okHttpStates.push(okHttpState);
        } else {
            okHttpStates.splice(index, 1, okHttpState);
        }
        this.setState({ okHttpStates });
    }

    connectWebSocket() {
        const address = this.state.address;

        const websocket = new WebSocket(address);
        websocket.onopen = () => {
            this.setState({ connected: true });
            console.log("wesocket open");
            localStorage.setItem("okhttp-watcher-web.last-address", address);
        };
        websocket.onclose = (event) => {
            this.setState({ connected: false });
            console.log("wesocket close, reason:", event.reason);
        };
        websocket.onmessage = (event: MessageEvent) => {
            const json = event.data as string;
            const data = JSON.parse(json);
            const okHttpState = data as OkHttpState;
            okHttpState.response.body.content = decodeHexString(data.response.body.content as string);
            this.updateOkHttpState(okHttpState);
        };
        websocket.onerror = (event) => {
            console.error("wesocket error:", event);
        };
    }

    disconnectWebSocket() {
        if (!this.websocket) return;
        this.websocket.close();
        this.websocket = null;
    }

    componentDidMount(): void {
        const address = localStorage.getItem("okhttp-watcher-web.last-address");
        if (address) this.setState({ address });
    }
}

function decodeHexString(hexString: string): Uint8Array {
    if (hexString.length % 2 !== 0) throw new Error("Not valid hex string");
    const byteLength = (hexString.length / 2);

    const byteArray = new Uint8Array(byteLength);

    for (let index = 0; index < byteLength; index++) {
        const pointer = 2 * index;
        const value = Number.parseInt(hexString.slice(pointer, pointer + 2), 16);
        byteArray[index] = value;
    }

    return byteArray;
}


function createFakeList(): Array<OkHttpState> {
    return [
        {
            uid: 1000,
            request: {
                url: "11111111",
            },
            response: {
                body: {
                    charset: "utf-8",
                    content: encodeContentUtf8("Hello, "),
                },
            },
        },
        {
            uid: 1001,
            request: {
                url: "2222222",
            },
            response: {
                body: {
                    charset: "utf-8",
                    content: encodeContentUtf8("World!"),
                },
            },
        },
    ];
}


function decodeContent(raw: Uint8Array, charsetName: string) {
    const decoder = new TextDecoder(charsetName ?? "utf-8");
    return decoder.decode(raw);
}

function encodeContentUtf8(raw: string) {
    const encoder = new TextEncoder();
    return encoder.encode(raw);
}

import "./ByteArrayView.scss";

export default function ByteArrayView(props: {
    byteArray: Uint8Array;
    lineByteLength?: number;
}) {
    const { byteArray, lineByteLength = 16 } = props;

    const lines: Array<string> = [];

    for (let index = 0; index < byteArray.length; index += lineByteLength) {
        const lineData = Array.from(byteArray.slice(index, index + lineByteLength));
        const line = lineData
            .map(it => it.toString(16).padStart(2, '0') + ' ')
            .join('')
            .padEnd(3 * lineByteLength, ' ')
            + String.fromCharCode(...lineData.map(it => (it >= 32 && it < 127) ? it : '.'.charCodeAt(0)));
        lines.push(line)
    }

    return (
        <div className='ByteArrayView'>
            <div className="data">
                {lines.map(line => (
                    <pre>{line}</pre>
                ))}
            </div>
        </div>
    );
}
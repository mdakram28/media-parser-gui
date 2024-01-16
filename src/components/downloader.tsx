import { useContext } from "react";
import { BitstreamExplorerContext } from "../bitstream/bitstream-explorer";
import { downloadBlob } from "../browser-util";
import { BitBuffer } from "../bitstream/buffer";



export function TrackDownloader({ downloadExtension = ".bin", transformer }: {
    downloadExtension?: string,
    transformer ?: (buffers: BitBuffer[]) => BitBuffer[]
}) {
    const { trackBuffer, fileName, setFileName } = useContext(BitstreamExplorerContext);

    return <>
        <a className="toolbar-item"
            data-tooltip={`Download track as raw "${downloadExtension}" file`}
            onClick={() => {
                let dlName = fileName || "unknown.xyz";
                if (dlName.indexOf('.') >= 0) {
                    dlName = dlName.substring(0, dlName.lastIndexOf("."));
                }
                dlName += downloadExtension;
                let buffers = trackBuffer;
                if (transformer) {
                    buffers = transformer(buffers);
                }
                downloadBlob(buffers.map(buff => buff.slice()), dlName, 'application/octet-stream');
            }}><i className="fas fa-download"></i></a>
    </>
}
import { useContext } from "react";
import { BitstreamExplorerContext } from "../bitstream/bitstream-explorer";
import { downloadBlob } from "../browser-util";
import { BitBuffer } from "../bitstream/buffer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { Tooltip, IconButton } from "@radix-ui/themes";

export function TrackDownloader({ downloadExtension = ".bin", transformer }: {
    downloadExtension?: string,
    transformer?: (buffers: BitBuffer[]) => BitBuffer[]
}) {
    const { trackBuffer, fileName } = useContext(BitstreamExplorerContext);

    return <Tooltip content={`Download track as raw "${downloadExtension}" file`}>
        <IconButton variant="ghost" size="1"
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
            }}>
            <FontAwesomeIcon icon={faDownload} style={{ fontSize: 12 }} />
        </IconButton>
    </Tooltip>
}

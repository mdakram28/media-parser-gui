import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { ISOBMFF } from "./mp4-bitstream";
import { MSBBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { SyntaxViewer } from "../../bitstream/syntax-viewer";

export const Mp4AnalyzerComponent = (props: {}) => {
    return <BitstreamExplorer
        parser={(buffer: Uint8Array) => {
            const bs = new Bitstream(new MSBBuffer(buffer));
            ISOBMFF(bs, bs.getEndPos());
            return bs.getCurrent();
        }}

        uploader={<BitstreamUploader title="Drop MP4 file here" samples={{
            "big_buck_bunny.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/big_buck_bunny.mp4"
        }}/>}
    >
        <div style={{ flex: 1, display: "flex", flexDirection: "row", height: "100%" }}>

            <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column" }} className="panel">
                <SyntaxViewer />
            </div>
            <div style={{ flex: 1, height: "100%" }} className="panel">
                <HexEditor />
            </div>
        </div >
    </BitstreamExplorer>
}

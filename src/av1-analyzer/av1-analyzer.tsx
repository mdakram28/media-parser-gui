import { HexEditor } from "../components/hex-editor";
import { Bitstream } from "../bitstream/parser";
import { MSBBuffer } from "../bitstream/buffer";
import { BitstreamExplorer } from "../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../bitstream/uploader";
import { SyntaxViewer } from "../bitstream/syntax-viewer";
import { AV1 } from "./av1-bitstream";

export const Av1AnalyzerComponent = (props: {}) => {
    return <BitstreamExplorer
        parser={(buffer: Uint8Array) => {
            const bs = new Bitstream(new MSBBuffer(buffer));
            AV1(bs);
            return bs.getCurrent();
        }}

        uploader={<BitstreamUploader />}
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

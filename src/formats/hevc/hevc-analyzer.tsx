import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { MSBBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { SyntaxViewer } from "../../bitstream/syntax-viewer";
import { HEVC } from "./hevc-bitstream";
import { SyntaxTable } from "../../components/syntax-table";

export const HevcAnalyzerComponent = (props: {}) => {
    return <BitstreamExplorer
        parser={(buffer: Uint8Array) => {
            const bs = new Bitstream(new MSBBuffer(buffer, new Uint8Array([0, 0, 3])));
            HEVC(bs);
            return bs.getCurrent();
        }}

        uploader={<BitstreamUploader title="Drop HEVC raw bitstream file" samples={{
            "aspen.hevc": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/aspen.hevc"
        }} />}
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

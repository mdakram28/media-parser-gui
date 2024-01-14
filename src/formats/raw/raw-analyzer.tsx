import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { MSBBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { SyntaxViewer } from "../../bitstream/syntax-viewer";

export const RawAnalyzerComponent = (props: {}) => {
    return <BitstreamExplorer
        parser={(buffer: Uint8Array) => {
            const bs = new Bitstream(new MSBBuffer(buffer));
            return {
                key: "ROOT",
                title: "ROOT",
                start: 0,
                size: bs.getEndPos()
            };
        }}

        uploader={<BitstreamUploader title="Drop binary file" samples={{
            "big_buck_bunny.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/big_buck_bunny.mp4",
            "big_buck_bunny.obu": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/big_buck_bunny.obu",
            "aspen.hevc": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/aspen.hevc",
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

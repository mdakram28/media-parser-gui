import { HexEditor } from "../../components/hex-editor";
import { Bitstream } from "../../bitstream/parser";
import { MSBBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer, EMPTY_TREE } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { SyntaxViewer } from "../../bitstream/syntax-viewer";
import { AV1 } from "./av1-bitstream";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { extractMp4Data, isMP4Format } from "../../formats/mp4/mp4-bitstream";

export const Av1AnalyzerComponent = (props: {}) => {
    return <BitstreamExplorer
        parser={(buffer: Uint8Array) => {
            const bs = new Bitstream(new MSBBuffer(buffer));
            AV1(bs);
            return bs.getCurrent();
        }}
        containers={["Detect", "MP4", "OBU (Fallback)"]}
        unpack={(buffer: Uint8Array, format: string) => {
            format = format.split(" ")[0].toLowerCase();
            if (format == "mp4" || (format == "detect" && isMP4Format(buffer))) {
                return extractMp4Data(buffer);
            }
            return buffer;
        }}
        uploader={<BitstreamUploader title="Drop AV1 raw bitstream file" samples={{
            "big_buck_bunny.obu": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/big_buck_bunny.obu",
            "big_buck_bunny.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/test-data/big_buck_bunny.mp4"
        }} />}
    >
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <SyntaxViewer />
            </Panel>
            <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical"/>
            <Panel className="panel">
                <HexEditor />
            </Panel>
        </PanelGroup>
    </BitstreamExplorer>
}

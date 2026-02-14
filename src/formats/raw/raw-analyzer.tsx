import { Bitstream } from "../../bitstream/parser";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { AnalyzerLayout } from "../../components/analyzer-layout";
import { HexEditor } from "../../components/hex-editor";

export function RawAnalyzerComponent() {
    return (
        <BitstreamExplorer
            parser={(buffers) => {
                const bs = new Bitstream(buffers[0]);
                return { key: "ROOT", varName: "root", title: "ROOT", start: 0, size: bs.getEndPos() };
            }}
            uploader={
                <BitstreamUploader title="Drop binary file" samples={{
                    "av1_multi.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_multi.mp4",
                    "av1_audvid.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_audvid.mp4",
                    "av1_single.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_single.mp4",
                    "av1_single.obu": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_single.obu",
                }} />
            }
        >
            <AnalyzerLayout
                left={<div />}
                right={<HexEditor />}
            />
        </BitstreamExplorer>
    );
}

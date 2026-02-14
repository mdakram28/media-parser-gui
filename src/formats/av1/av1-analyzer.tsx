import { useState } from "react";
import { toast } from "sonner";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { AV1 } from "./av1-bitstream";
import { extractMp4Tracks, isMP4Format } from "../mp4/mp4-bitstream";
import { extractIvfTracks, isIVFFormat } from "../ivf/ivf-bitstream";
import { MediaTrack } from "../../types/media.types";
import { AnalyzerLayout } from "../../components/analyzer-layout";
import { TrackSelector } from "../../components/track-selector";
import { TrackDownloader } from "../../components/downloader";
import { SyntaxToolbar } from "../../components/syntax-toolbar";
import { SyntaxTable } from "../../components/syntax-table";
import { HexEditor } from "../../components/hex-editor";
import { FrameViewer } from "../../components/frame-viewer";
import { TabsComponent } from "../../components/tabs";

export function Av1AnalyzerComponent() {
    const [tracks, setTracks] = useState<Record<string, MediaTrack>>({});
    const [selectedTrack, setSelectedTrack] = useState<string>();

    return (
        <BitstreamExplorer
            parser={(buffer) => AV1(buffer)}
            containers={["Detect", "MP4", "IVF", "OBU"]}
            unpack={(buffer, format) => {
                format = format.split(" ")[0].toLowerCase();
                if (format === "mp4" || (format === "detect" && isMP4Format(buffer))) {
                    const found = extractMp4Tracks(buffer, ["av01"]);
                    if (Object.keys(found).length === 0) {
                        toast.error('Could not find "av01" track in MP4 file');
                        return ["mp4", []];
                    }
                    setTracks(found);
                    const trackId = selectedTrack || Object.keys(found)[0];
                    return ["mp4", found[trackId].chunkRanges.map((r) => new BitBuffer(buffer, r))];
                }
                if (format === "ivf" || (format === "detect" && isIVFFormat(buffer))) {
                    const found = extractIvfTracks(buffer, ["av01"]);
                    if (Object.keys(found).length === 0) {
                        toast.error('Could not find "av01" track in IVF file');
                        return ["ivf", []];
                    }
                    setTracks(found);
                    const trackId = selectedTrack || Object.keys(found)[0];
                    return ["ivf", found[trackId].chunkRanges.map((r) => new BitBuffer(buffer, r))];
                }
                return ["obu", [new BitBuffer(buffer)]];
            }}
            uploader={
                <BitstreamUploader title="Drop AV1 raw bitstream file" samples={{
                    "av1_multi.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_multi.mp4",
                    "av1_single.ivf": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_single.ivf",
                    "av1_audvid.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_audvid.mp4",
                    "av1_single.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_single.mp4",
                    "av1_single.obu": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/av1_single.obu",
                }} />
            }
        >
            <AnalyzerLayout
                left={<>
                    <SyntaxToolbar leftItems={<>
                        <TrackSelector tracks={tracks} selectedTrack={selectedTrack} onSelect={setSelectedTrack} />
                        <TrackDownloader downloadExtension=".obu" />
                    </>} />
                    <SyntaxTable />
                </>}
                right={
                    <TabsComponent defaultTab="frame" tabs={[
                        { key: "frame", title: "Frame", render: <FrameViewer config={{ codec: "av01.0.15M.10" }} /> },
                        { key: "hexEditor", title: "Hex", render: <HexEditor /> },
                    ]} />
                }
            />
        </BitstreamExplorer>
    );
}

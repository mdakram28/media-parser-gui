import { useState } from "react";
import { toast } from "sonner";
import { BitBuffer } from "../../bitstream/buffer";
import { BitstreamExplorer } from "../../bitstream/bitstream-explorer";
import { BitstreamUploader } from "../../bitstream/uploader";
import { HEVC, SystemStreamHEVC, isSystemStreamHEVC, systemStreamToAnnexB } from "./hevc-bitstream";
import { extractMp4Tracks, isMP4Format } from "../mp4/mp4-bitstream";
import { MediaTrack } from "../../types/media.types";
import { AnalyzerLayout } from "../../components/analyzer-layout";
import { TrackSelector } from "../../components/track-selector";
import { TrackDownloader } from "../../components/downloader";
import { SyntaxToolbar } from "../../components/syntax-toolbar";
import { SyntaxTable } from "../../components/syntax-table";
import { HexEditor } from "../../components/hex-editor";
import { FrameViewerFfmpeg } from "../../components/frame-viewer-libde265";
import { TabsComponent } from "../../components/tabs";

export function HevcAnalyzerComponent() {
    const [tracks, setTracks] = useState<Record<string, MediaTrack>>({});
    const [selectedTrack, setSelectedTrack] = useState<string>();

    return (
        <BitstreamExplorer
            parser={(buffers, format) => {
                return format === "hevc_ss" ? SystemStreamHEVC(buffers) : HEVC(buffers[0]);
            }}
            containers={["Detect", "MP4", "hevc", "hevc_ss (system stream)"]}
            unpack={(buffer, format) => {
                format = format.split(" ")[0].toLowerCase();
                if (format === "mp4" || (format === "detect" && isMP4Format(buffer))) {
                    const found = extractMp4Tracks(buffer, ["hev1"]);
                    if (Object.keys(found).length === 0) {
                        toast.error('Could not find "hev1" track in MP4 file');
                        return ["mp4", []];
                    }
                    setTracks(found);
                    const trackId = selectedTrack || Object.keys(found)[0];
                    return ["hevc_ss", found[trackId].chunkRanges.map((r) => new BitBuffer(buffer, r))];
                }
                if (format === "hevc_ss" || (format === "detect" && isSystemStreamHEVC([new BitBuffer(buffer)]))) {
                    return ["hevc_ss", [new BitBuffer(buffer)]];
                }
                return ["hevc", [new BitBuffer(buffer)]];
            }}
            uploader={
                <BitstreamUploader title="Drop HEVC raw bitstream file" samples={{
                    "hevc_single.mp4": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/hevc_single.mp4",
                    "hevc_single.hevc": "https://raw.githubusercontent.com/mdakram28/media-parser-gui/main/sample_data/hevc_single.hevc",
                }} />
            }
        >
            <AnalyzerLayout
                left={<>
                    <SyntaxToolbar leftItems={<>
                        <TrackSelector tracks={tracks} selectedTrack={selectedTrack} onSelect={setSelectedTrack} />
                        <TrackDownloader downloadExtension=".hevc" transformer={systemStreamToAnnexB} />
                    </>} />
                    <SyntaxTable />
                </>}
                right={
                    <TabsComponent defaultTab="hexEditor" tabs={[
                        { key: "frame", title: "Frame", render: <FrameViewerFfmpeg /> },
                        { key: "hexEditor", title: "Hex", render: <HexEditor /> },
                    ]} />
                }
            />
        </BitstreamExplorer>
    );
}

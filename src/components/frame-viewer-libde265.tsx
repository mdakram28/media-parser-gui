import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { BitstreamExplorerContext } from "../bitstream/bitstream-explorer";
import { mod } from "../browser-util";
import { HEVCSplitNalu, isSystemStreamHEVC, systemStreamToAnnexB } from "../formats/hevc/hevc-bitstream";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Tooltip, IconButton, Progress, Flex, Text, Spinner } from "@radix-ui/themes";

const NALU_PUSH_DELAY = 0;

export function FrameViewerFfmpeg() {
    const { trackBuffer } = useContext(BitstreamExplorerContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const logRef = useRef<HTMLPreElement>(null);
    const cancelledRef = useRef(false);
    const [frames, setFrames] = useState<ImageData[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [decoding, setDecoding] = useState(false);
    const [error, setError] = useState<string>();

    const log = (...msgs: any[]) => {
        if (!logRef.current) {
            console.log(...msgs);
            return;
        }
        const pre = logRef.current;
        pre.textContent += msgs.map((m) => m.toString()).join(" ") + "\n";
        pre.scrollTop = pre.scrollHeight;
    };

    (window as any).logger = { log, error: log };

    const redraw = useCallback(() => {
        if (currentFrame >= frames.length) return;
        const canvas = canvasRef.current!;
        const frame = frames[currentFrame];

        canvas.width = frame.width;
        canvas.height = frame.height;
        canvas.style.width = frame.width + "px";
        canvas.style.height = frame.height + "px";
        canvas.getContext("2d")!.putImageData(frame, 0, 0);
    }, [frames, currentFrame]);

    const extractFrames = async () => {
        const { Libde265 }: any = await import("../third_party/libde265");
        const libde265 = new Libde265({ log, error: log }).libde265;
        const decoder = new libde265.Decoder(true);

        decoder.set_image_callback((image: any) => {
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext("2d")!;
            const w = image.get_width();
            const h = image.get_height();
            const imageData = ctx.createImageData(w, h);
            for (let i = 0; i < w * h; i++) {
                imageData.data[i * 4 + 3] = 255;
            }
            image.display(imageData, (displayData: any) => {
                if (!cancelledRef.current) {
                    setFrames((prev) => [...prev, displayData]);
                }
            });
            image.free();
        });

        let buffer = trackBuffer;
        if (isSystemStreamHEVC(trackBuffer)) {
            log("Converting to annexB for decoding");
            buffer = systemStreamToAnnexB(buffer);
        }

        const nalus = HEVCSplitNalu(buffer);
        log(`Nalu found: ${nalus.length}`);

        const pushNalu = () => {
            if (cancelledRef.current) return;

            if (nalus.length === 0) {
                decoder.flush();
                if (!cancelledRef.current) {
                    setDecoding(false);
                    log("Decoding finished");
                }
                return;
            }
            const nalu = nalus.shift()?.slice();
            decoder.push_data(nalu);

            decoder.decode((err: any) => {
                if (cancelledRef.current) return;

                switch (err) {
                    case libde265.DE265_ERROR_WAITING_FOR_INPUT_DATA:
                        setTimeout(pushNalu, NALU_PUSH_DELAY);
                        return;
                    default:
                        if (!libde265.de265_isOK(err)) {
                            const errMsg = libde265.de265_get_error_text(err);
                            log("Error: " + errMsg);
                            if (!cancelledRef.current) setError(errMsg);
                            return;
                        }
                }

                if (nalus.length > 0) {
                    setTimeout(pushNalu, NALU_PUSH_DELAY);
                    return;
                }

                if (!cancelledRef.current) {
                    setDecoding(false);
                    log("Decoding finished");
                }
                decoder.free();
            });
        };

        log("Starting decoding");
        setTimeout(pushNalu, NALU_PUSH_DELAY);
        setFrames([]);
        return decoder;
    };

    useEffect(() => {
        cancelledRef.current = false;
        setDecoding(true);
        setError(undefined);
        setCurrentFrame(0);

        const decoder = extractFrames();
        return () => {
            cancelledRef.current = true;
            decoder.then((dec) => dec.free());
        };
    }, [trackBuffer]);

    useEffect(() => { redraw(); }, [frames, currentFrame]);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(() => redraw());
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [containerRef.current]);

    const prevFrame = () => setCurrentFrame(mod(currentFrame - 1, frames.length));
    const nextFrame = () => setCurrentFrame(mod(currentFrame + 1, frames.length));

    return (
        <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Flex align="center" style={{ height: 36, background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)", borderBottom: "1px solid var(--glass-border)", flexShrink: 0 }}>
                <Tooltip content="Previous frame">
                    <IconButton variant="ghost" size="1" onClick={prevFrame} disabled={frames.length === 0}>
                        <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 12 }} />
                    </IconButton>
                </Tooltip>
                <Text size="2" color="gray" style={{ paddingInline: 12 }}>
                    {currentFrame} / {frames.length}
                </Text>
                <Tooltip content="Next frame">
                    <IconButton variant="ghost" size="1" onClick={nextFrame} disabled={frames.length === 0}>
                        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 12 }} />
                    </IconButton>
                </Tooltip>
                {decoding && (
                    <Flex align="center" gap="2" style={{ paddingInline: 8 }}>
                        <Spinner size="1" />
                        <Text size="1" color="gray">Decoding...</Text>
                    </Flex>
                )}
            </Flex>
            {error && (
                <Flex align="center" style={{ padding: "8px 12px", background: "var(--red-a2)", borderBottom: "1px solid var(--red-a5)" }}>
                    <Text size="1" color="red">{error}</Text>
                </Flex>
            )}
            <canvas
                ref={canvasRef}
                tabIndex={0}
                style={{ border: "1px solid var(--glass-border)" }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowRight") nextFrame();
                    else if (e.key === "ArrowLeft") prevFrame();
                }}
            />
            <div style={{ marginTop: 12, paddingInline: 4 }}>
                <Progress value={frames.length > 0 ? (100 * currentFrame / frames.length) : 0} />
            </div>
            <pre ref={logRef} style={{ flex: 1, overflow: "auto", fontSize: 12, color: "var(--gray-a11)", marginTop: 8 }} />
        </div>
    );
}

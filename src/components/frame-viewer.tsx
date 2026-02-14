import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { BitstreamExplorerContext } from "../bitstream/bitstream-explorer";
import { mod } from "../browser-util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Tooltip, IconButton, Progress, Flex, Text, Spinner } from "@radix-ui/themes";

export function FrameViewer({ config }: { config: VideoDecoderConfig }) {
    const { trackBuffer } = useContext(BitstreamExplorerContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [frames, setFrames] = useState<VideoFrame[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [decoding, setDecoding] = useState(false);
    const [error, setError] = useState<string>();

    const redraw = useCallback(() => {
        if (currentFrame >= frames.length) return;
        const canvas = canvasRef.current!;
        const container = containerRef.current!;
        const frame = frames[currentFrame];
        const ratio = frame.displayWidth / frame.displayHeight;
        const w = container.clientWidth - 2;
        const h = w / ratio - 2;

        canvas.width = w;
        canvas.height = h;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        canvas.getContext("2d")!.drawImage(frame, 0, 0, w, h);
    }, [frames, currentFrame, containerRef]);

    useEffect(() => {
        let cancelled = false;
        setDecoding(true);
        setError(undefined);
        setFrames([]);
        setCurrentFrame(0);

        (async () => {
            const decoded: VideoFrame[] = [];
            try {
                const decoder = new VideoDecoder({
                    output: (frame) => decoded.push(frame),
                    error: (err) => {
                        if (!cancelled) setError(`Decode error: ${err.message}`);
                    },
                });
                decoder.configure(config);

                for (const buffer of trackBuffer) {
                    decoder.decode(new EncodedVideoChunk({
                        timestamp: 0,
                        type: "key",
                        duration: 1,
                        data: buffer.slice(),
                    }));
                }
                await decoder.flush();
            } catch (err: any) {
                if (!cancelled) setError(`Decode failed: ${err.message || err}`);
            }
            if (!cancelled) {
                setFrames(decoded);
                setDecoding(false);
            } else {
                decoded.forEach((f) => f.close());
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [trackBuffer, config]);

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
            </Flex>
            {decoding && (
                <Flex align="center" justify="center" gap="2" style={{ padding: 24 }}>
                    <Spinner size="2" />
                    <Text size="2" color="gray">Decoding...</Text>
                </Flex>
            )}
            {error && (
                <Flex align="center" justify="center" style={{ padding: 24 }}>
                    <Text size="2" color="red">{error}</Text>
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
        </div>
    );
}

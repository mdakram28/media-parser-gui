import { useCallback, useContext, useState } from "react";
import { BitstreamExplorerContext } from "./bitstream-explorer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudUploadAlt } from "@fortawesome/free-solid-svg-icons";
import { Button, TextField, Text, Select, Spinner, Flex } from "@radix-ui/themes";
import { toast } from "sonner";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export function BitstreamUploader({ title, samples }: { title: string, samples?: { [name: string]: string } }) {
    const { setFileBuffer, setFileName, containerFormat, setContainerFormat, containers } = useContext(BitstreamExplorerContext);
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);

    const readFileUploadData = useCallback((file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            toast.warning(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 100 MB.`);
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            const buff = new Uint8Array(event.target?.result as ArrayBuffer);
            if (buff.length === 0) return;
            setFileName(file.name);
            setFileBuffer(buff);
        };

        reader.onerror = () => {
            toast.error("Failed to read file");
        };

        reader.readAsArrayBuffer(file);
    }, []);

    const loadFromUrl = useCallback(async (url: string) => {
        if (!url) return;
        setLoading(true);
        try {
            const response = await fetch(url);
            const buffer = new Uint8Array(await response.arrayBuffer());
            if (buffer.byteLength > MAX_FILE_SIZE) {
                toast.warning(`File too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB). Maximum size is 100 MB.`);
                return;
            }
            setFileName(url.split('#')[0].split('?')[0].split('/').pop());
            setFileBuffer(buffer);
        } catch (err) {
            toast.error(`Failed to load file: ${err}`);
        } finally {
            setLoading(false);
        }
    }, [setFileBuffer, setFileName]);

    return <div style={{
        width: "100%",
        maxWidth: 480,
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-3)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
    }}>
        <div style={{ width: "100%" }}
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);

                const { files } = e.dataTransfer;

                if (files && files.length) {
                    readFileUploadData(files[0]);
                }
            }}>
            <label style={{
                display: "flex",
                width: "100%",
                minHeight: 150,
                padding: 32,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
                color: dragOver ? "var(--accent-11)" : "var(--gray-a11)",
                border: `2px ${dragOver ? "solid" : "dashed"} ${dragOver ? "var(--accent-9)" : "var(--glass-border)"}`,
                borderRadius: "var(--radius-2)",
                cursor: "pointer",
                transition: "all 0.2s",
                background: dragOver ? "var(--accent-a2)" : "var(--glass-highlight)",
            }}>
                <FontAwesomeIcon icon={faCloudUploadAlt} style={{ fontSize: 40 }} />
                <span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>
                <span style={{ fontSize: 12, opacity: 0.6 }}>or click to browse</span>
                <input
                    type="file"
                    style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
                    onChange={e => e.target.files && readFileUploadData(e.target.files[0])}
                />
            </label>
        </div>

        {samples && <Flex direction="column" gap="1">
            <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Sample File</Text>
            <form style={{ display: "flex", gap: 8 }} onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const search = new FormData(e.currentTarget).get("url")?.toString() || "";
                loadFromUrl(search);
            }}>
                <select name="url" style={{
                    flex: 1,
                    height: 32,
                    borderRadius: "var(--radius-2)",
                    border: "1px solid var(--glass-border)",
                    background: "transparent",
                    paddingInline: 12,
                    fontSize: 14,
                    minWidth: 0,
                    color: "inherit",
                }}>
                    {Object.entries(samples).map(([k, v]) => <option key={v} value={v}>{k}</option>)}
                </select>
                <Button type="submit" variant="outline" size="1" disabled={loading}>
                    {loading ? <><Spinner size="1" />Loading</> : "Load"}
                </Button>
            </form>
        </Flex>}

        <Flex direction="column" gap="1">
            <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>From URL</Text>
            <form style={{ display: "flex", gap: 8 }} onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const search = new FormData(e.currentTarget).get("url")?.toString() || "";
                loadFromUrl(search);
            }}>
                <TextField.Root name="url" placeholder="https://example.com/file.mp4" size="1" style={{ flex: 1 }} />
                <Button type="submit" variant="outline" size="1" disabled={loading}>
                    {loading ? <><Spinner size="1" />Loading</> : "Load"}
                </Button>
            </form>
        </Flex>

        {containers && <Flex direction="column" gap="1">
            <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Container Format</Text>
            <Select.Root size="1" value={containerFormat} onValueChange={setContainerFormat}>
                <Select.Trigger />
                <Select.Content>
                    {containers.map((c) => <Select.Item key={c} value={c}>{c}</Select.Item>)}
                </Select.Content>
            </Select.Root>
        </Flex>}
    </div>
}

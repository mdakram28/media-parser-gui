import "./index.css";
import { useState } from "react";
import { Av1AnalyzerComponent } from "./formats/av1/av1-analyzer";
import { Mp4AnalyzerComponent } from "./formats/mp4/mp4-analyzer";
import { RawAnalyzerComponent } from "./formats/raw/raw-analyzer";
import { HevcAnalyzerComponent } from "./formats/hevc/hevc-analyzer";
import { IvfAnalyzerComponent } from "./formats/ivf/ivf-analyzer";
import { Theme, Tabs, Switch, Text, Flex, Box } from "@radix-ui/themes";
import { Toaster } from "sonner";
import GitHubButton from "react-github-btn";

const ANALYZERS = [
  { key: "av1", title: "AV1", component: <Av1AnalyzerComponent /> },
  { key: "hevc", title: "HEVC", component: <HevcAnalyzerComponent /> },
  { key: "mp4", title: "MP4", component: <Mp4AnalyzerComponent /> },
  { key: "ivf", title: "IVF", component: <IvfAnalyzerComponent /> },
  { key: "raw", title: "Raw", component: <RawAnalyzerComponent /> },
];

export default function Dashboard() {
  const [appearance, setAppearance] = useState<"dark" | "light">("dark");

  return (
    <Theme appearance={appearance} accentColor="iris" grayColor="slate" radius="medium" style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
    }}>
      <Tabs.Root defaultValue="av1" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Flex align="center" style={{
          height: 44,
          borderBottom: "1px solid var(--glass-border)",
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          flexShrink: 0,
          paddingInline: 4,
        }}>
          <Text size="2" weight="bold" style={{ paddingInline: 12 }}>
            Multimedia Explorer
          </Text>
          <Tabs.List>
            {ANALYZERS.map((a) => (
              <Tabs.Trigger key={a.key} value={a.key}>
                {a.title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Box flexGrow="1" />
          <Flex align="center" gap="2" style={{ paddingInline: 12 }}>
            <GitHubButton
              href="https://github.com/mdakram28/media-parser-gui"
              data-color-scheme="no-preference: dark; light: dark; dark: dark;"
              data-size="large"
              aria-label="Star mdakram28/media-parser-gui on GitHub"
            >
              Star
            </GitHubButton>
          </Flex>
          <Flex align="center" gap="2" style={{ paddingInline: 12 }}>
            <Text as="label" size="1" color="gray">Light</Text>
            <Switch
              size="1"
              defaultChecked
              onCheckedChange={(checked) => setAppearance(checked ? "dark" : "light")}
            />
            <Text as="label" size="1" color="gray">Dark</Text>
          </Flex>
        </Flex>
        {ANALYZERS.map((a) => (
          <Tabs.Content key={a.key} value={a.key} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
            {a.component}
          </Tabs.Content>
        ))}
      </Tabs.Root>
      <Toaster theme={appearance} richColors />
    </Theme>
  );
}

import "./app.scss";
import "./common.scss";
import * as React from 'react';
import { Av1AnalyzerComponent } from './formats/av1/av1-analyzer';
import { Mp4AnalyzerComponent } from './formats/mp4/mp4-analyzer';
import { Switch } from "@mui/material";
import { RawAnalyzerComponent } from "./formats/raw/raw-analyzer";
import { HevcAnalyzerComponent } from "./formats/hevc/hevc-analyzer";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import GitHubButton from 'react-github-btn';

export default function Dashboard() {
  const [page, setPage] = React.useState("av1");
  const menuItems = [{
    page: "av1",
    title: "AV1 parser"
  }, {
    page: "mp4",
    title: "MP4 parser"
  }, {
    page: "raw",
    title: "Raw viewer"
  }, {
    page: "hevc",
    title: "HEVC parser"
  }]

  const setTheme = (theme: string) => {
    const c = document.body.classList;
    c.remove("dark");
    c.remove("light");
    c.add(theme);
  }

  React.useEffect(() => {
    document.body.classList.add("dark");
  }, []);
  console.log("Main rendered");

  return (
    <main>
      <div className="toolbar">
        <div className="toolbar-item"><b>Multimedia Explorer</b></div>
        {menuItems.map((menu) =>
          <NavLink to={"/" + menu.page} key={menu.page}
            className={({ isActive }) => "toolbar-item " + (isActive && "active")}>
            {menu.title}
          </NavLink>
        )}
        <span style={{ flex: 1 }}></span>
        <div className="toolbar-item gh">
          <GitHubButton
            href="https://github.com/mdakram28/av1-parser-gui"
            data-color-scheme="no-preference: dark; light: dark; dark: dark;"
            data-size="large"
            aria-label="Star mdakram28/av1-parser-gui on GitHub"
          >Star</GitHubButton>
        </div>
        <div className="toolbar-item">
          Light
          <Switch defaultChecked={true} inputProps={{ 'aria-label': "Dark" }} onClick={(ev: any) => setTheme(ev.target.checked ? "dark" : "light")} />
          Dark
        </div>
      </div>
      <div className="content">
        <Routes>
          <Route path="/mp4" element={<Mp4AnalyzerComponent />} />
          <Route path="/hevc" element={<HevcAnalyzerComponent />} />
          <Route path="/raw" element={<RawAnalyzerComponent />} />
          <Route path="*" element={<Av1AnalyzerComponent />} />
        </Routes>
      </div>
    </main>
  );
}
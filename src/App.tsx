import "./app.scss";
import * as React from 'react';
import { Av1AnalyzerComponent } from './formats/av1/av1-analyzer';
import { Mp4AnalyzerComponent } from './formats/mp4/mp4-analyzer';
import { Switch } from "@mui/material";
import { RawAnalyzerComponent } from "./formats/raw/raw-analyzer";
import { HevcAnalyzerComponent } from "./formats/hevc/hevc-analyzer";


export default function Dashboard() {
  const [page, setPage] = React.useState("av1");
  const menuItems = [{
    page: "av1",
    title: "AV1 parser"
  },{
    page: "mp4",
    title: "MP4 parser"
  },{
    page: "raw",
    title: "Raw viewer"
  },{
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
          <a key={menu.page} 
            className={"toolbar-item " + (page === menu.page && "active")}
            onClick={() => setPage(menu.page)}>
              {menu.title}
          </a>
        )}
        <span style={{flex: 1}}></span>
        <div className="toolbar-item">
          Light
          <Switch inputProps={{'aria-label': "Dark"}} onClick={(ev: any) => setTheme(ev.target.checked ? "dark" : "light")}/>
          Dark
        </div>
      </div>
      <div className="content">
        { page == "av1" && <Av1AnalyzerComponent /> }
        { page == "mp4" && <Mp4AnalyzerComponent /> }
        { page == "hevc" && <HevcAnalyzerComponent /> }
        { page == "raw" && <RawAnalyzerComponent /> }
      </div>
    </main>
  );
}
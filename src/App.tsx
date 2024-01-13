import "./app.scss";
import * as React from 'react';
import { Av1AnalyzerComponent } from './av1-analyzer/av1-analyzer';
import GitHubButton from 'react-github-btn'
import { Route, Routes } from 'react-router-dom';
import { Mp4AnalyzerComponent } from './mp4/mp4-analyzer';
import { Switch } from "@mui/material";


export default function Dashboard() {
  const [page, setPage] = React.useState("av1");
  const menuItems = [{
    page: "av1",
    title: "AV1 parser"
  },{
    page: "mp4",
    title: "MP4 parser"
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
      </div>
    </main>
  );
}
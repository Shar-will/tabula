import React, { JSX } from "react";
import ReactDOM from "react-dom/client";
import { Button } from "./components/ui/button";
import "./index.css";
import { SquarePlus, ClockFading, Cog } from "lucide-react";

function Popup(): JSX.Element {
  return (
    <div className="w-80 p-4 bg-background">
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-foreground">Tabula Settings</h1>

        <div className="space-y-2">
          <Button className="w-full" variant="outline" size="default">
            Open New Tab
            <SquarePlus className="ml-2 h-4 w-4"/>
          </Button>
          <Button className="w-full" variant="secondary" size="default">
            Recent Tabs
            <ClockFading className="ml-2 h-4 w-4"/>
          </Button>
          <Button className="w-full" variant="outline" size="default">
            Settings
            <Cog className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Quick access to Tabula features
        </p>
      </div>
    </div>
  );
}

const root = document.getElementById('popup-root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  )
}
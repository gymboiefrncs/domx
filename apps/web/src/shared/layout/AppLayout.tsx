import { Outlet } from "react-router-dom";
import { Nav } from "@/shared/components/Nav";

export const AppLayout = () => {
  return (
    <div className="app-shell">
      <Nav />
      <div className="main-pane">
        <Outlet />
      </div>
    </div>
  );
};

import { Outlet } from "react-router-dom";
import { Nav } from "@/components/Nav";

export const AppLayout = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <Nav />
    </div>
  );
};

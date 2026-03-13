import { Header } from "./components/Header";
import { Nav } from "./components/Nav";
import { GroupPage } from "./pages/GroupPage";

export function App() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <GroupPage />
      <Nav />
    </div>
  );
}

// TODO: create signup ui

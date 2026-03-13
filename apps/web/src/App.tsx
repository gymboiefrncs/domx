import { Header } from "./components/Header";
import { Nav } from "./components/Nav";
import { HomePage } from "./pages/Feed";

export function App() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <HomePage />
      <Nav />
    </div>
  );
}

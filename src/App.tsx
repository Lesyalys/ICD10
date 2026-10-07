// import MkbSearch from "./MkbSearch.jsx";
import { useState } from "react";
import MenuScreen from "./page/Home";
import CallCardScreen from "./page/CallCardScreen";

export default function App() {
  const [screen, setScreen] = useState<"menu" | "call">("menu");

  return screen === "menu" ? (
    <MenuScreen onOpen={() => setScreen("call")} />
  ) : (
    <CallCardScreen onBack={() => setScreen("menu")} />
  );
}

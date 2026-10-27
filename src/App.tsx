// src/App.tsx
import { useState } from "react";
import MenuScreen from "./screens/Home";
import CallCardScreen from "./screens/CallCardScreen";
import ConsultantScreen from "./screens/ConsultantScreen";

type Screen = "menu" | "call" | "consultant";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");

  if (screen === "call") {
    return <CallCardScreen onBack={() => setScreen("menu")} />;
  }

  if (screen === "consultant") {
    return <ConsultantScreen onBack={() => setScreen("menu")} />;
  }

  return (
    <MenuScreen
      onOpen={() => setScreen("call")}
      onOpenConsultant={() => setScreen("consultant")}
    />
  );
}

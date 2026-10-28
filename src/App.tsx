// src/App.tsx
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/Toaster.tsx";
import MenuScreen from "./screens/Home";
import CallCardScreen from "./screens/CallCardScreen";
import ConsultantScreen from "./screens/ConsultantScreen";
import MkbDirectoryScreen from "./screens/MkbDirectory.tsx";

export default function App() {
  return (
    <HashRouter>
      <Toaster>
        <Routes>
          <Route path="/" element={<MenuScreen />} />
          <Route
            path="/call"
            element={<CallCardScreen onBack={() => window.history.back()} />}
          />
          <Route path="/mkb" element={<MkbDirectoryScreen />} />
          <Route
            path="/consultant"
            element={
              <ConsultantScreen
                onBack={() => window.history.back()}
                onOpenCard={() => {
                  // Открываем карточку по ID
                  window.history.back();
                }}
              />
            }
          />
        </Routes>
      </Toaster>
    </HashRouter>
  );
}

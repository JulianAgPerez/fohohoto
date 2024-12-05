import React from "react";
import SnowEffect from "./components/SnowEffect";

const App: React.FC = () => {
  return (
    <div className="relative flex justify-center items-center h-screen">
      <SnowEffect />
      <h1 className="text-center text-red-500 z-20">¡Feliz Navidad!</h1>
    </div>
  );
};

export default App;

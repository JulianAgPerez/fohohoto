import React from "react";
import SnowEffect from "./components/SnowEffect";

const App: React.FC = () => {
  return (
    <div>
      <h1 className="text-center text-white z-20">¡Feliz Navidad!</h1>
      <SnowEffect />
    </div>
  );
};

export default App;

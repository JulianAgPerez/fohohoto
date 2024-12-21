import React from "react";
import SnowEffect from "./components/SnowEffect";
import Home from "./view/Home";
import ImageUploader from "./components/ImageUploader";

const App: React.FC = () => {
  return (
    <>
      <Home />
      <SnowEffect />
      <ImageUploader />
    </>
  );
};

export default App;

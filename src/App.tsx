import React from "react";
import SnowEffect from "./components/SnowEffect";
import Home from "./view/Home";
import ImageUploader from "./components/ImageUploader";

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-blue-950">
      {/* Fondo nocturno */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="hero-sky absolute inset-0" />
        <div className="stars-bg absolute inset-0 opacity-60" />
        <div className="hero-vignette absolute inset-0" />
      </div>
      <div className="relative z-10">
        <Home />
        <SnowEffect />
        <section id="uploader">
          <ImageUploader />
        </section>
      </div>
      <footer className="relative z-10 pb-10 pt-2 text-center text-sm text-amber-100/75">
        Hecho con ❤️ para las fiestas · Fohohoto 🎄 · De{" "}
        <a href="https://www.linkedin.com/in/julian-perez-dev/">Julian</a>
      </footer>
    </div>
  );
};

export default App;

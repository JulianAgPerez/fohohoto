import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import SnowEffect from "./components/SnowEffect";
import Particles from "@tsparticles/react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Particles
        id="snow"
        options={{
          background: {
            color: "#000000", // Fondo negro para que las partículas sean visibles
          },
          particles: {
            color: {
              value: "#fff", // Color blanco para las partículas de nieve
            },
            move: {
              direction: "bottom", // Movimiento hacia abajo para un efecto realista
              enable: true,
              outModes: "out", // Las partículas reaparecen en la parte superior una vez que salen de la parte inferior de la página
              speed: 2, // Velocidad lenta para un efecto realista
            },
            number: {
              density: {
                enable: true,
                //area: 800, // Área para la densidad de partículas
              },
              value: 400, // Número de partículas
            },
            opacity: {
              value: 0.7, // Opacidad de las partículas
            },
            shape: {
              type: "circle", // Forma circular para las partículas
            },
            size: {
              value: 10, // Tamaño de las partículas
            },
            wobble: {
              enable: true,
              distance: 10, // Distancia de wobble
              speed: 10, // Velocidad de wobble
            },
            zIndex: {
              value: {
                min: 0,
                max: 100,
              },
            },
          },
        }}
      />

      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;

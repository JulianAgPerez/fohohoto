import { FC, useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import {
  type Container,
  type ISourceOptions,
  MoveDirection,
  OutMode,
} from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

const SnowEffect: FC = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log(container);
  };

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "#0d47a1",
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          repulse: {
            distance: 50,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: "#ffffff", // color de copo de nieve
        },
        move: {
          direction: MoveDirection.bottom, // movimiento continuo hacia abajo
          enable: true,
          outModes: {
            default: OutMode.out, // partículas desaparecen al salir del area
          },
          random: true,
          speed: 2, // velocidad de caida para efecto de nieve más realista
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 100, // Número de partículas
        },
        opacity: {
          value: 0.7,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 5 },
        },
      },
      detectRetina: true, //habilita la detección de pantallas de alta densidad de píxeles (o.o)
    }),
    []
  );

  if (init) {
    return (
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
      />
    );
  }

  return <></>;
};

export default SnowEffect;

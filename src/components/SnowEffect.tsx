import { FC, useMemo } from "react";
import {
  Particles,
  ParticlesProvider,
  useParticlesProvider,
} from "@tsparticles/react";
import {
  type ISourceOptions,
  MoveDirection,
  OutMode,
} from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { loadWobbleUpdater } from "@tsparticles/updater-wobble";

const SnowCanvas: FC = () => {
  const { loaded } = useParticlesProvider();

  const options: ISourceOptions = useMemo(() => {
    /* const coarsePointer = window.matchMedia("(pointer: coarse)").matches; */
    return {
      fpsLimit: 60,
      interactivity: /* coarsePointer
        ? {}
        : */ {
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
            easing: "ease-out-bounce",
          },
        },
      },
      particles: {
        paint: {
          fill: {
            enable: true,
            color: { value: "#ffffff" },
            opacity: 0.7,
          },
        },
        move: {
          direction: MoveDirection.bottom, // movimiento continuo hacia abajo
          /* drift: {
            min: 0.01,
            max: 0.04,
          }, */
          enable: true,
          /* gravity: {
            acceleration: {
              min: 0,
              max: 0.05,
            },
            enable: true,
            inverse: false,
            maxSpeed: {
              min: 0.5,
              max: 1.8,
            },
          }, */
          outModes: {
            default: OutMode.out, // particulas desaparecen al salir del area
          },
          size: true,
          speed: {
            min: 0.8,
            max: 2,
          },
          straight: false,
        },
        wobble: {
          enable: true, // los copos se mecen mientras caen
          distance: {
            min: 8,
            max: 14,
          },
          speed: {
            angle: {
              min: 5,
              max: 20,
            },
            move: {
              min: 3,
              max: 6,
            },
          },
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 100,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 5 },
        },
      },
      detectRetina: true, //habilita la detección de pantallas de alta densidad de píxeles (o.o)
    };
  }, []);

  if (loaded) {
    return <Particles id="tsparticles" options={options} />;
  }

  return <></>;
};

const SnowEffect: FC = () => {
  return (
    <ParticlesProvider
      init={async (engine) => {
        await loadWobbleUpdater(engine);
        // loadSlim ya registra interactividad + easing + interactors
        await loadSlim(engine);
      }}
    >
      <SnowCanvas />
    </ParticlesProvider>
  );
};

export default SnowEffect;

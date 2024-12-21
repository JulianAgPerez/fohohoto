import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChristmasDictionary } from "../types/ChristmasDictionary";

const Home = () => {
  const [index, setIndex] = useState(0);
  const translations = Object.values(ChristmasDictionary);

  // Encuentra la palabra más larga para calcular el ancho fijo
  const longestWord = translations.reduce(
    (longest, word) => (word.length > longest.length ? word : longest),
    ""
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % translations.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [translations]);

  return (
    <div className="relative flex justify-center items-center h-screen bg-blue-900">
      <h1 className="text-center text-9xl text-red-500 z-20">
        ¡Feliz{" "}
        <AnimatePresence mode="wait">
          <motion.span
            key={translations[index]}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
            style={{
              width: `${longestWord.length * 0.8}ch`,
            }}
          >
            {translations[index]}
          </motion.span>
        </AnimatePresence>
        !
      </h1>
    </div>
  );
};

export default Home;

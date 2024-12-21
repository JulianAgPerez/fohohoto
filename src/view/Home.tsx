import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChristmasDictionary } from "../types/ChristmasDictionary";

const Home = () => {
  const [index, setIndex] = useState(0);
  const translations = Object.values(ChristmasDictionary);

  //Encuentra la palabra más larga
  const longestWord = translations.reduce((a, b) =>
    a.length > b.length ? a : b
  );

  const getWidth = (length: number) => {
    if (length <= 5) return "5ch";
    if (length <= 8) return "9ch";
    if (length <= 10) return "12ch";
    return "14ch";
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % translations.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [translations]);

  return (
    <div className="relative flex justify-center items-center h-screen bg-blue-900">
      <h1 className="text-center text-9xl text-red-500 z-20 flex items-center ">
        ¡Feliz{" "}
        <AnimatePresence mode="wait">
          <motion.span
            key={translations[index]}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="inline-flex justify-center"
            style={{
              width: getWidth(translations[index].length),
            }}
          >
            {translations[index]}
          </motion.span>
        </AnimatePresence>
        <span>!</span>
      </h1>
    </div>
  );
};

export default Home;

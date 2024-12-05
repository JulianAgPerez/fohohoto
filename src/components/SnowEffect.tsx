import React from "react";
import { motion } from "framer-motion";

interface SnowflakeProps {
  delay: number;
}

const Snowflake: React.FC<SnowflakeProps> = ({ delay }) => (
  <motion.div
    className="snowflake"
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: "100vh", opacity: 1 }}
    transition={{
      duration: 10,
      delay: delay,
      repeat: Infinity,
      repeatDelay: 0,
      ease: "linear",
    }}
  >
    ❄️
  </motion.div>
);

const SnowEffect: React.FC = () => {
  const snowflakes = Array.from({ length: 30 });

  return (
    <div className="snow-container">
      {snowflakes.map((_, index) => (
        <Snowflake key={index} delay={index * 0.5} />
      ))}
    </div>
  );
};

export default SnowEffect;

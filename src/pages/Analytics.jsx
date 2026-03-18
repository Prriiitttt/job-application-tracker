import React from "react";
import { motion } from "framer-motion";


export default function Analytics() {
  return (
    <motion.div
      className="home"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div>sum analytics</div>
    </motion.div>
  );
}

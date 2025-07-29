import { motion } from "motion/react";

export default function AnimatedButton( ) {
    return (
        <motion.button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            transition={{
                duration: 0.2, ease: [0.4, 0, 0.2, 1]}}
        >
            Test Animation
        </motion.button>
    )
}
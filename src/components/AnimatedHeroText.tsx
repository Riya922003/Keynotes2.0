'use client'

import { motion } from 'framer-motion'

interface AnimatedHeroTextProps {
  text?: string
  className?: string
}

export default function AnimatedHeroText({ 
  text = 'Your Space to Think and Create.', 
  className = '' 
}: AnimatedHeroTextProps) {
  const words = text.split(' ')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const wordVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      filter: 'blur(10px)'
    },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        ease: 'easeOut' as const
      }
    }
  }

  return (
    <motion.h1
      className={`text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          className="inline-block mr-4"
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  )
}
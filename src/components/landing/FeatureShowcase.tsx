'use client'

import Image from 'next/image'
import { useState } from 'react'

const features = [
  {
    id: 'plan',
    title: 'Plan',
    description: 'Turn dreams into actionable goals',
    emoji: '📋',
  },
  {
    id: 'create',
    title: 'Create',
    description: 'Unleash creativity without limits',
    emoji: '🎨',
  },
  {
    id: 'organize',
    title: 'Organize',
    description: 'Bring structure to your thoughts',
    emoji: '📚',
  },
  {
    id: 'focus',
    title: 'Focus',
    description: 'Find clarity in the chaos',
    emoji: '🎯',
  }
]

const collageImages = [
  '/assets/Images/ashley-west-edwards-4XOuAqQSj-Y-unsplash.jpg', // Large image
  '/assets/Images/content-pixie-m-gqDRzbJLQ-unsplash.jpg',
  '/assets/Images/debby-hudson-U0aEuoMuDt0-unsplash.jpg',
  '/assets/Images/jess-bailey-q10VITrVYUM-unsplash (1).jpg',
  '/assets/Images/pexels-psco-191429.jpg',
  '/assets/Images/annie-spratt-hCb3lIB8L8E-unsplash (1).jpg',
]

export default function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState('plan')

  const activeFeature = features.find(feature => feature.id === activeTab) || features[0]

  const getImageStyle = (imageIndex: number) => {
    // Map feature images to collage positions (using 6 images in 2x3 grid)
    const featureImageMap: { [key: string]: number[] } = {
      'plan': [0, 1, 2],        // Top row images
      'create': [3, 4, 5],      // Bottom row images  
      'organize': [0, 3],       // Left column images
      'focus': [0, 1, 2, 3, 4, 5]  // All images highlight for focus
    }

    const activeImageIndices = featureImageMap[activeTab] || []
    const isActive = activeImageIndices.includes(imageIndex)

    // Keep full opacity for all images, just add a subtle highlight effect for active ones
    return isActive 
      ? "object-cover rounded-lg transition-all duration-500 ease-in-out ring-2 ring-primary/30 hover:opacity-80"
      : "object-cover rounded-lg transition-all duration-500 ease-in-out hover:opacity-80"
  }

  return (
    <>
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-foreground mb-4">
          Your Journey to Better Thinking
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover your perfect journaling style through our interactive showcase
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left Column - Interactive Image Collage */}
        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          {/* Row 1 */}
          <div className="flex gap-4">
            <div className="relative aspect-square flex-1">
              <Image
                src={collageImages[0]}
                alt="Image 1"
                fill
                className={getImageStyle(0)}
                sizes="(max-width: 768px) 33vw, 20vw"
              />
            </div>
            <div className="relative aspect-square flex-1">
              <Image
                src={collageImages[1]}
                alt="Image 2"
                fill
                className={getImageStyle(1)}
                sizes="(max-width: 768px) 33vw, 20vw"
              />
            </div>
            <div className="relative aspect-square flex-1">
              <Image
                src={collageImages[2]}
                alt="Image 3"
                fill
                className={getImageStyle(2)}
                sizes="(max-width: 768px) 33vw, 20vw"
              />
            </div>
          </div>
          
          {/* Row 2 */}
          <div className="flex gap-4">
            <div className="relative aspect-square flex-1">
              <Image
                src={collageImages[3]}
                alt="Image 4"
                fill
                className={getImageStyle(3)}
                sizes="(max-width: 768px) 33vw, 20vw"
              />
            </div>
            <div className="relative aspect-square flex-1">
              <Image
                src={collageImages[4]}
                alt="Image 5"
                fill
                className={getImageStyle(4)}
                sizes="(max-width: 768px) 33vw, 20vw"
              />
            </div>
            <div className="relative aspect-square flex-1">
              <Image
                src={collageImages[5]}
                alt="Image 6"
                fill
                className={getImageStyle(5)}
                sizes="(max-width: 768px) 33vw, 20vw"
              />
            </div>
          </div>
        </div>


        {/* Right Column - Interactive Tabs */}
        <div className="space-y-6">
          {/* Tab Buttons */}
          <div className="flex flex-wrap gap-3">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === feature.id
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                <span className="mr-2">{feature.emoji}</span>
                {feature.title}
              </button>
            ))}
          </div>

          {/* Active Feature Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg min-h-[200px] transition-all duration-500 hover:shadow-xl hover:scale-105 hover:border-primary/20">
            <div 
              key={activeTab} 
              className="animate-in fade-in duration-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl animate-in zoom-in duration-300">
                  {activeFeature.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground">
                    {activeFeature.title}
                  </h3>
                </div>
                {/* Sparkle toggle moved to header */}
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {activeFeature.description}
              </p>
              
              {/* Additional details for each feature */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {activeFeature.id === 'plan' && "Start your journey by setting clear, achievable goals that align with your vision."}
                  {activeFeature.id === 'create' && "Express yourself freely with powerful tools designed for unlimited creative expression."}
                  {activeFeature.id === 'organize' && "Keep your thoughts structured and easily accessible with intelligent organization features."}
                  {activeFeature.id === 'focus' && "Eliminate distractions and find mental clarity with our focus-enhancing tools."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/* Splash cursor is handled globally by SplashProvider */}
    </>
  )
}
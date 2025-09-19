import { HeartPulse, Users, Sparkles, Lock } from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: HeartPulse,
      title: "Reflect & Understand",
      description: "Track your mood and gain insights with our built-in sentiment analysis."
    },
    {
      icon: Users,
      title: "Capture & Collaborate",
      description: "Jot down notes and share them with your team in real-time."
    },
    {
      icon: Sparkles,
      title: "Design & Personalize",
      description: "Make each entry your own with beautiful themes and our Canva integration."
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "Your thoughts are yours alone. Your journal is always private and secure."
    }
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
          All Your Thoughts, Perfectly Organized.
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div key={index} className="group flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-xl hover:scale-105 hover:border-primary/20 transition-all duration-300 cursor-pointer">
                <div className="mb-4 p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
'use client'

import { useRef } from 'react'
import Autoplay from 'embla-carousel-autoplay'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'

export default function SocialProof() {
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false })
  )

  const testimonials = [
    {
      quote: "Keynotes has become my digital sanctuary for daily reflection.",
      name: "Jordan P.",
      role: "Writer",
      avatar: "JP"
    },
    {
      quote: "The collaboration features are incredible. My team loves how easy it is to share ideas.",
      name: "Alex D.",
      role: "Designer",
      avatar: "AD"
    },
    {
      quote: "Finally, a journaling app that understands privacy. My thoughts feel secure here.",
      name: "Sam M.",
      role: "Therapist",
      avatar: "SM"
    },
    {
      quote: "The sentiment analysis helps me understand my emotional patterns better.",
      name: "Casey R.",
      role: "Student",
      avatar: "CR"
    },
    {
      quote: "Perfect for organizing my research notes and collaborating with colleagues.",
      name: "Dr. Maya L.",
      role: "Researcher",
      avatar: "ML"
    },
    {
      quote: "The Canva integration makes my journal entries visually stunning.",
      name: "Riley K.",
      role: "Content Creator",
      avatar: "RK"
    }
  ]

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            A Quiet Corner on the Internet
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our users are saying.
          </p>
        </div>
        
        <Carousel
          plugins={[plugin.current]}
          opts={{
            loop: true,
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="pt-6">
                    <blockquote className="text-lg italic text-muted-foreground leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>
                  </CardContent>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {testimonial.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}
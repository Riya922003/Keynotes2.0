'use server'

import { db } from '@/lib/db'
import { subscribers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

// Validation schema for email
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

// Type for the action state
type ActionState = {
  success: boolean
  message: string
}

export async function subscribeToAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    // Get email from form data
    const email = formData.get('email') as string

    // Validate email with Zod
    const validationResult = emailSchema.safeParse({ email })
    
    if (!validationResult.success) {
      return {
        success: false,
        message: validationResult.error.issues[0].message
      }
    }

    const validatedEmail = validationResult.data.email

    // Check if email already exists in subscribers table
    const existingSubscriber = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, validatedEmail))
      .limit(1)

    if (existingSubscriber.length > 0) {
      return {
        success: false,
        message: "You're already subscribed!"
      }
    }

    // Insert new subscriber
    await db.insert(subscribers).values({
      email: validatedEmail
    })

    return {
      success: true,
      message: "Thank you for subscribing!"
    }

  } catch (error) {
    console.error('Subscription error:', error)
    return {
      success: false,
      message: "Something went wrong. Please try again."
    }
  }
}
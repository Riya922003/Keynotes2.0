"use server"

import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users, workspaces, workspace_members } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

interface RegisterUserInput {
  name: string
  email: string
  password: string
}

export async function registerUser({ name, email, password }: RegisterUserInput) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return { error: "User already exists" }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate unique IDs for user and workspace
    const userId = randomUUID()
    const workspaceId = randomUUID()

    try {
      // 1. Create the user
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          name,
          email,
          hashed_password: hashedPassword,
        })
        .returning({ id: users.id })

      // 2. Create default workspace
      const [newWorkspace] = await db
        .insert(workspaces)
        .values({
          id: workspaceId,
          name: "Personal Workspace",
          owner_id: newUser.id,
        })
        .returning({ id: workspaces.id })

      // 3. Add user as owner to workspace_members
      await db
        .insert(workspace_members)
        .values({
          user_id: newUser.id,
          workspace_id: newWorkspace.id,
          role: "owner",
        })

      return { success: true }
    } catch (insertError) {
      console.error("Database insert error:", insertError)
      return { error: "Failed to create account. Please try again." }
    }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Failed to create account. Please try again." }
  }
}
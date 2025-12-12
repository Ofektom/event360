import NextAuth from "@/auth"
import type { NextRequest } from "next/server"

const handler = NextAuth

export { handler as GET, handler as POST }

import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const userProfile = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      serviceUsers: {
        include: {
          service: true,
        },
      },
    },
  });

  return new Response(JSON.stringify(userProfile), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

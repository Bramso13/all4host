import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const agentProfile = await prisma.agentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!agentProfile) {
      return new Response(JSON.stringify({ error: "Profil agent non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const specialties = await prisma.agentSpecialty.findMany({
      where: { agentId: agentProfile.id },
      orderBy: { name: "asc" },
    });

    return new Response(JSON.stringify(specialties), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur GET /api/agents/my-specialties:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer tous les managers créés par l'utilisateur super admin connecté
export async function GET(request: Request) {
  try {
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

    // Vérifier si l'utilisateur est un super admin
    if (session.user.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Accès réservé aux super admins" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Récupérer le profil super admin de l'utilisateur connecté
    const superAdminProfile = await prisma.superAdminProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!superAdminProfile) {
      return new Response(JSON.stringify({ managers: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Récupérer tous les managers créés par ce super admin
    const managers = await prisma.poleManagerProfile.findMany({
      where: {
        superAdminId: superAdminProfile.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        superAdmin: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        properties: {
          include: {
            owner: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        managedAgents: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Marquer le manager qui correspond à l'utilisateur connecté (lui-même)
    const managersWithSelfFlag = managers.map(manager => ({
      ...manager,
      isCurrentUser: manager.userId === session.user.id,
    }));

    return new Response(JSON.stringify({ managers: managersWithSelfFlag }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des managers:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
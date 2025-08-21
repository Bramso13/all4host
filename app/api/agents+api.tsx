import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";

import { withAccelerate } from "@prisma/extension-accelerate";

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

    const agents = await prisma.agentProfile.findMany({
      where: {
        manager: {
          userId: session.user.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        manager: {
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
        specialties: true,
        cleaningSessions: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        maintenanceSessions: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        tickets: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        taskAssignments: true,
      },
    });

    return new Response(JSON.stringify(agents), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des agents:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, email, agentType } = body;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Données manquantes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Trouver le manager de l'utilisateur connecté
    const manager = await prisma.poleManagerProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return new Response(JSON.stringify({ error: "Manager non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await auth.api.signUpEmail({
      body: {
        email: email,
        password: "password",
        name: name,
      },
    });

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Erreur lors de la création de l'utilisateur",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const agentProfile = await prisma.agentProfile.create({
      data: {
        userId: user.user.id,
        agentType: agentType,
        availability: "offline",
        completedTasks: 0,
        isActive: true,
        hireDate: new Date(),
        managerId: manager.id,
        certifications: [],
        serviceZones: [],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        manager: {
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
        specialties: true,
      },
    });

    await prisma.user.update({
      where: { id: user.user.id },
      data: {
        role: "agent",
      },
    });

    return new Response(JSON.stringify(agentProfile), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'agent:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(request: Request) {
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

    const body = await request.json();
    const { id, name, description, userId } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que l'agent appartient au manager connecté
    const existingAgent = await prisma.agentProfile.findFirst({
      where: {
        id: id,
        manager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingAgent) {
      return new Response(JSON.stringify({ error: "Agent non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const agent = await prisma.agentProfile.update({
      where: { id: id },
      data: body,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        manager: {
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
        specialties: true,
      },
    });

    return new Response(JSON.stringify(agent), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'agent:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request: Request) {
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

    const body = await request.json();
    const { id } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que l'agent appartient au manager connecté
    const existingAgent = await prisma.agentProfile.findFirst({
      where: {
        id: id,
        manager: {
          userId: session.user.id,
        },
      },
      include: {
        user: true,
      },
    });

    if (!existingAgent) {
      return new Response(JSON.stringify({ error: "Agent non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Supprimer l'agent (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.agentProfile.delete({
      where: { id: id },
    });

    // Réinitialiser le rôle de l'utilisateur
    if (existingAgent.user) {
      await prisma.user.update({
        where: { id: existingAgent.user.id },
        data: {
          role: "property_owner",
        },
      });
    }

    return new Response(
      JSON.stringify({ message: "Agent supprimé avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de l'agent:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

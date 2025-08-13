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

    const agents = await prisma.agent.findMany({
      where: {
        conciergerieManager: {
          userId: session.user.id,
        },
      },
      include: {
        user: true,
        conciergerieManager: true,
        maintenanceSessions: true,
        cleaningSessions: true,
        tasks: true,
        tickets: true,
        cleaningPlannings: true,
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
    const { name, description, userId, type, email } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Trouver le conciergerie manager de l'utilisateur
    const conciergerieManager = await prisma.conciergerieManager.findFirst({
      where: { userId: session.user.id },
    });

    if (!conciergerieManager) {
      return new Response(
        JSON.stringify({ error: "Manager de conciergerie non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
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

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        userId: user.user.id,
        conciergerieManagerId: conciergerieManager.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        type,
      },
    });

    if (!agent) {
      return new Response(JSON.stringify(agent), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    await prisma.user.update({
      where: { id: user.user.id },
      data: {
        agent: {
          connect: {
            id: agent.id,
          },
        },
        role: "agent",
      },
    });

    return new Response(JSON.stringify(agent), {
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
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id: id,
        conciergerieManager: {
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

    const agent = await prisma.agent.update({
      where: { id: id },
      data: {
        name,
        description,
        userId,
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
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id: id,
        conciergerieManager: {
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

    // Supprimer l'agent (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.agent.delete({
      where: { id: id },
    });

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

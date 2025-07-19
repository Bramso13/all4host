import { auth } from "~/lib/auth";
import { PrismaClient } from "@prisma/client";
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

    const siteCleaningSessions = await prisma.siteCleaningSession.findMany({
      where: {
        cleaningManager: {
          userId: session.user.id,
        },
      },
      include: {
        interventionSite: true,
        cleaningManager: true,
        cleaningAgent: true,
        photos: true,
        checklist: true,
      },
    });

    return new Response(JSON.stringify(siteCleaningSessions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des sessions de nettoyage:",
      error
    );
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
    const {
      interventionSiteId,
      startDate,
      endDate,
      duration,
      notes,
      status,
      cleaningAgentId,
    } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Trouver le cleaning manager de l'utilisateur
    const cleaningManager = await prisma.cleaningManager.findFirst({
      where: { userId: session.user.id },
    });

    if (!cleaningManager) {
      return new Response(
        JSON.stringify({ error: "Manager de nettoyage non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const siteCleaningSession = await prisma.siteCleaningSession.create({
      data: {
        interventionSiteId,
        cleaningManagerId: cleaningManager.id,
        startDate,
        endDate,
        duration,
        notes,
        status: status || "planned",
        cleaningAgentId,
      },
    });

    return new Response(JSON.stringify(siteCleaningSession), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la session de nettoyage:",
      error
    );
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
    const {
      id,
      interventionSiteId,
      startDate,
      endDate,
      duration,
      notes,
      status,
      cleaningAgentId,
    } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que la session appartient au manager connecté
    const existingSession = await prisma.siteCleaningSession.findFirst({
      where: {
        id: id,
        cleaningManager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingSession) {
      return new Response(
        JSON.stringify({ error: "Session de nettoyage non trouvée" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const siteCleaningSession = await prisma.siteCleaningSession.update({
      where: { id: id },
      data: {
        interventionSiteId,
        startDate,
        endDate,
        duration,
        notes,
        status,
        cleaningAgentId,
      },
    });

    return new Response(JSON.stringify(siteCleaningSession), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la session de nettoyage:",
      error
    );
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

    // Vérifier que la session appartient au manager connecté
    const existingSession = await prisma.siteCleaningSession.findFirst({
      where: {
        id: id,
        cleaningManager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingSession) {
      return new Response(
        JSON.stringify({ error: "Session de nettoyage non trouvée" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Supprimer la session (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.siteCleaningSession.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({ message: "Session de nettoyage supprimée avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de la session de nettoyage:",
      error
    );
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

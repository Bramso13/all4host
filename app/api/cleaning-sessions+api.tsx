import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer les sessions de nettoyage du manager connecté
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

    // Récupérer le manager profile de l'utilisateur connecté
    const manager = await prisma.poleManagerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Profil manager non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que le manager a les droits pour le pôle nettoyage
    if (!manager.poleTypes.includes("cleaning")) {
      return new Response(
        JSON.stringify({ error: "Accès non autorisé au pôle nettoyage" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const cleaningSessions = await prisma.cleaningSession.findMany({
      where: {
        managerId: manager.id,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        agent: {
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        photos: true,
        checklist: true,
      },
      orderBy: {
        scheduledDate: "desc",
      },
    });

    return new Response(JSON.stringify(cleaningSessions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des sessions de nettoyage:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer une nouvelle session de nettoyage
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

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Récupérer le manager profile de l'utilisateur connecté
    const manager = await prisma.poleManagerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Profil manager non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que le manager a les droits pour le pôle nettoyage
    if (!manager.poleTypes.includes("cleaning")) {
      return new Response(
        JSON.stringify({ error: "Accès non autorisé au pôle nettoyage" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      propertyId,
      agentId,
      scheduledDate,
      cleaningType,
      notes,
      duration,
    } = body;

    // Validation des données
    if (!propertyId || !agentId || !scheduledDate || !cleaningType) {
      return new Response(
        JSON.stringify({ 
          error: "Les champs propertyId, agentId, scheduledDate et cleaningType sont obligatoires" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la propriété appartient au manager
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        managerId: manager.id,
      },
    });

    if (!property) {
      return new Response(
        JSON.stringify({ error: "Propriété non trouvée ou non autorisée" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que l'agent appartient au manager
    const agent = await prisma.agentProfile.findFirst({
      where: {
        id: agentId,
        managerId: manager.id,
        agentType: { in: ["cleaning", "multi_service"] },
      },
    });

    if (!agent) {
      return new Response(
        JSON.stringify({ error: "Agent non trouvé ou non autorisé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const cleaningSession = await prisma.cleaningSession.create({
      data: {
        propertyId,
        agentId,
        scheduledDate: new Date(scheduledDate),
        cleaningType,
        notes,
        duration,
        managerId: manager.id,
        status: "planned",
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        agent: {
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return new Response(JSON.stringify(cleaningSession), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la session de nettoyage:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour une session de nettoyage
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

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await request.json();
    const {
      id,
      propertyId,
      agentId,
      scheduledDate,
      cleaningType,
      notes,
      duration,
      status,
      startTime,
      endTime,
      agentNotes,
    } = body;

    // Validation des données
    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID de la session requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer le manager profile de l'utilisateur connecté
    const manager = await prisma.poleManagerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Profil manager non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que la session appartient au manager
    const existingSession = await prisma.cleaningSession.findFirst({
      where: {
        id: id,
        managerId: manager.id,
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

    const updatedSession = await prisma.cleaningSession.update({
      where: { id: id },
      data: {
        ...(propertyId && { propertyId }),
        ...(agentId && { agentId }),
        ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
        ...(cleaningType && { cleaningType }),
        ...(notes !== undefined && { notes }),
        ...(duration !== undefined && { duration }),
        ...(status && { status }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(agentNotes !== undefined && { agentNotes }),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        agent: {
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return new Response(JSON.stringify(updatedSession), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la session de nettoyage:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer une session de nettoyage
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

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await request.json();
    const { id } = body;

    // Validation des données
    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID de la session requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer le manager profile de l'utilisateur connecté
    const manager = await prisma.poleManagerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Profil manager non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que la session appartient au manager
    const existingSession = await prisma.cleaningSession.findFirst({
      where: {
        id: id,
        managerId: manager.id,
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

    // Vérifier que la session peut être supprimée (pas en cours)
    if (existingSession.status === "in_progress") {
      return new Response(
        JSON.stringify({
          error: "Impossible de supprimer une session en cours"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer la session
    await prisma.cleaningSession.delete({
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
    console.error("Erreur lors de la suppression de la session de nettoyage:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
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

    const maintenanceSessions = await prisma.maintenanceSession.findMany({
      where: {
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
      include: {
        property: true,
        maintenance: true,
        agent: true,
        photos: true,
      },
    });

    return new Response(JSON.stringify(maintenanceSessions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des sessions de maintenance:",
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
    const { propertyId, maintenanceId, agentId, startDate, endDate, notes } =
      body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que le bien appartient au manager connecté
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        conciergerieManager: {
          userId: session.user.id,
        },
      },
    });

    if (!property) {
      return new Response(JSON.stringify({ error: "Bien non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const maintenanceSession = await prisma.maintenanceSession.create({
      data: {
        propertyId,
        maintenanceId,
        agentId,
        startDate,
        endDate,
        notes,
      },
    });

    return new Response(JSON.stringify(maintenanceSession), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la session de maintenance:",
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
      propertyId,
      maintenanceId,
      agentId,
      startDate,
      endDate,
      notes,
    } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que la session appartient à un bien du manager connecté
    const existingSession = await prisma.maintenanceSession.findFirst({
      where: {
        id: id,
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingSession) {
      return new Response(
        JSON.stringify({ error: "Session de maintenance non trouvée" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const maintenanceSession = await prisma.maintenanceSession.update({
      where: { id: id },
      data: {
        propertyId,
        maintenanceId,
        agentId,
        startDate,
        endDate,
        notes,
      },
    });

    return new Response(JSON.stringify(maintenanceSession), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la session de maintenance:",
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

    // Vérifier que la session appartient à un bien du manager connecté
    const existingSession = await prisma.maintenanceSession.findFirst({
      where: {
        id: id,
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingSession) {
      return new Response(
        JSON.stringify({ error: "Session de maintenance non trouvée" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Supprimer la session (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.maintenanceSession.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({
        message: "Session de maintenance supprimée avec succès",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de la session de maintenance:",
      error
    );
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

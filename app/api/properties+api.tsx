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

    const properties = await prisma.property.findMany({
      where: {
        conciergerieManager: {
          userId: session.user.id,
        },
      },
      include: {
        conciergerieManager: true,
        cleaningSessions: true,
        maintenanceSessions: true,
        reservations: true,
        payments: true,
        tickets: true,
        photos: true,
      },
    });

    return new Response(JSON.stringify(properties), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des biens:", error);
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
      name,
      description,
      status,
      location,
      surface,
      numberOfRooms,
      numberOfBathrooms,
    } = body;

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

    const property = await prisma.property.create({
      data: {
        name,
        description,
        status: status || "available",
        location,
        surface,
        numberOfRooms,
        numberOfBathrooms,
        conciergerieManagerId: conciergerieManager.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return new Response(JSON.stringify(property), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du bien:", error);
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
      name,
      description,
      status,
      location,
      surface,
      numberOfRooms,
      numberOfBathrooms,
    } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que le bien appartient au manager connecté
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        conciergerieManager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingProperty) {
      return new Response(JSON.stringify({ error: "Bien non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const property = await prisma.property.update({
      where: { id: id },
      data: {
        name,
        description,
        status,
        location,
        surface,
        numberOfRooms,
        numberOfBathrooms,
      },
    });

    return new Response(JSON.stringify(property), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du bien:", error);
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

    // Vérifier que le bien appartient au manager connecté
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        conciergerieManager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingProperty) {
      return new Response(JSON.stringify({ error: "Bien non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Supprimer le bien (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.property.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({ message: "Bien supprimé avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du bien:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

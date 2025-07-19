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

    const reservations = await prisma.reservation.findMany({
      where: {
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
      include: {
        property: true,
      },
    });

    return new Response(JSON.stringify(reservations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations:", error);
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
    const { propertyId, startDate, endDate, client, notes } = body;

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

    const reservation = await prisma.reservation.create({
      data: {
        propertyId,
        startDate,
        endDate,
        client,
        notes,
      },
    });

    return new Response(JSON.stringify(reservation), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
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
    const { id, propertyId, startDate, endDate, client, notes } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que la réservation appartient à un bien du manager connecté
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        id: id,
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingReservation) {
      return new Response(
        JSON.stringify({ error: "Réservation non trouvée" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const reservation = await prisma.reservation.update({
      where: { id: id },
      data: {
        propertyId,
        startDate,
        endDate,
        client,
        notes,
      },
    });

    return new Response(JSON.stringify(reservation), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la réservation:", error);
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

    // Vérifier que la réservation appartient à un bien du manager connecté
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        id: id,
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingReservation) {
      return new Response(
        JSON.stringify({ error: "Réservation non trouvée" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Supprimer la réservation (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.reservation.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({ message: "Réservation supprimée avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la réservation:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

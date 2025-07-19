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

    const payments = await prisma.payment.findMany({
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

    return new Response(JSON.stringify(payments), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des paiements:", error);
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
    const { amount, currency, method, status, propertyId } = body;

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

    const payment = await prisma.payment.create({
      data: {
        amount,
        currency: currency || "EUR",
        method,
        status,
        propertyId,
      },
    });

    return new Response(JSON.stringify(payment), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du paiement:", error);
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
    const { id, amount, currency, method, status, propertyId } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que le paiement appartient à un bien du manager connecté
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: id,
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingPayment) {
      return new Response(JSON.stringify({ error: "Paiement non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payment = await prisma.payment.update({
      where: { id: id },
      data: {
        amount,
        currency,
        method,
        status,
        propertyId,
      },
    });

    return new Response(JSON.stringify(payment), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du paiement:", error);
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

    // Vérifier que le paiement appartient à un bien du manager connecté
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: id,
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingPayment) {
      return new Response(JSON.stringify({ error: "Paiement non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Supprimer le paiement (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.payment.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({ message: "Paiement supprimé avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du paiement:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

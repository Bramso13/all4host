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

    const tickets = await prisma.ticket.findMany({
      where: {
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
      include: {
        property: true,
        agent: true,
        photos: true,
      },
    });

    return new Response(JSON.stringify(tickets), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des tickets:", error);
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
    const { title, description, status, priority, propertyId, agentId } = body;

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

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        status: status || "open",
        priority,
        propertyId,
        agentId,
      },
    });

    return new Response(JSON.stringify(ticket), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du ticket:", error);
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
    const { id, title, description, status, priority, propertyId, agentId } =
      body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que le ticket appartient à un bien du manager connecté
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id: id,
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingTicket) {
      return new Response(JSON.stringify({ error: "Ticket non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ticket = await prisma.ticket.update({
      where: { id: id },
      data: {
        title,
        description,
        status,
        priority,
        propertyId,
        agentId,
      },
    });

    return new Response(JSON.stringify(ticket), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du ticket:", error);
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

    // Vérifier que le ticket appartient à un bien du manager connecté
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id: id,
        property: {
          conciergerieManager: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingTicket) {
      return new Response(JSON.stringify({ error: "Ticket non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Supprimer le ticket (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.ticket.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({ message: "Ticket supprimé avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du ticket:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

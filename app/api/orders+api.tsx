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

    const orders = await prisma.order.findMany({
      where: {
        laundryManager: {
          userId: session.user.id,
        },
      },
      include: {
        laundryManager: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        deliveryNotes: true,
      },
    });

    return new Response(JSON.stringify(orders), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes:", error);
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
      receivedDate,
      deliveryDate,
      client,
      address,
      phone,
      total,
      orderItems,
    } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Trouver le laundry manager de l'utilisateur
    const laundryManager = await prisma.laundryManager.findFirst({
      where: { userId: session.user.id },
    });

    if (!laundryManager) {
      return new Response(
        JSON.stringify({ error: "Manager de blanchisserie non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const order = await prisma.order.create({
      data: {
        name,
        description,
        status: status || "received",
        receivedDate,
        deliveryDate,
        client,
        address,
        phone,
        total,
        laundryManagerId: laundryManager.id,
        orderItems: {
          create:
            orderItems?.map((item: any) => ({
              quantity: item.quantity,
              price: item.price,
              productId: item.productId,
            })) || [],
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(order), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la commande:", error);
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
      receivedDate,
      deliveryDate,
      client,
      address,
      phone,
      total,
    } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que la commande appartient au manager connecté
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: id,
        laundryManager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingOrder) {
      return new Response(JSON.stringify({ error: "Commande non trouvée" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const order = await prisma.order.update({
      where: { id: id },
      data: {
        name,
        description,
        status,
        receivedDate,
        deliveryDate,
        client,
        address,
        phone,
        total,
      },
    });

    return new Response(JSON.stringify(order), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande:", error);
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

    // Vérifier que la commande appartient au manager connecté
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: id,
        laundryManager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingOrder) {
      return new Response(JSON.stringify({ error: "Commande non trouvée" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Supprimer la commande (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.order.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({ message: "Commande supprimée avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la commande:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

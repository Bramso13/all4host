import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer les articles d'une commande
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

    // Vérifier si l'utilisateur a accès au pôle blanchisserie
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "laundry"
        },
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Accès au pôle blanchisserie requis" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "ID de commande manquant" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la commande appartient au manager
    const order = await prisma.laundryOrder.findFirst({
      where: {
        id: orderId,
        managerId: manager.id,
      },
    });

    if (!order) {
      return new Response(
        JSON.stringify({ error: "Commande non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const orderItems = await prisma.laundryOrderItem.findMany({
      where: {
        orderId: orderId,
      },
      include: {
        product: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return new Response(JSON.stringify(orderItems), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des articles:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer un nouvel article de commande
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

    // Vérifier les permissions pour créer des articles
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "laundry"
        },
        canManageClients: true,
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes pour gérer les articles" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { orderId, productId, quantity, unitPrice, notes } = body;

    // Validation des données obligatoires
    if (!orderId || typeof orderId !== "string") {
      return new Response(
        JSON.stringify({ error: "L'ID de la commande est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!productId || typeof productId !== "string") {
      return new Response(
        JSON.stringify({ error: "L'ID du produit est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      return new Response(
        JSON.stringify({ error: "La quantité doit être un nombre positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof unitPrice !== "number" || unitPrice <= 0) {
      return new Response(
        JSON.stringify({ error: "Le prix unitaire doit être un nombre positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la commande appartient au manager
    const order = await prisma.laundryOrder.findFirst({
      where: {
        id: orderId,
        managerId: manager.id,
      },
    });

    if (!order) {
      return new Response(
        JSON.stringify({ error: "Commande non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le produit existe et est actif
    const product = await prisma.laundryProduct.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
    });

    if (!product) {
      return new Response(
        JSON.stringify({ error: "Produit non trouvé ou inactif" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculer le sous-total
    const subtotal = quantity * unitPrice;

    // Créer l'article et mettre à jour la commande en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'article
      const orderItem = await tx.laundryOrderItem.create({
        data: {
          quantity,
          unitPrice,
          subtotal,
          notes: notes?.trim(),
          orderId,
          productId,
        },
        include: {
          product: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          },
        },
      });

      // Mettre à jour le total de la commande
      const newSubtotal = order.subtotal + subtotal;
      const newTotalAmount = newSubtotal + (order.taxes || 0) + (order.deliveryFee || 0);

      await tx.laundryOrder.update({
        where: { id: orderId },
        data: {
          subtotal: newSubtotal,
          totalAmount: newTotalAmount,
        },
      });

      return orderItem;
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'article:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour un article de commande
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

    // Vérifier les permissions
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "laundry"
        },
        canManageClients: true,
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { id, quantity, unitPrice, notes } = body;

    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID de l'article requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer l'article actuel
    const existingItem = await prisma.laundryOrderItem.findFirst({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!existingItem) {
      return new Response(
        JSON.stringify({ error: "Article non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la commande appartient au manager
    if (existingItem.order.managerId !== manager.id) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validation des données si fournies
    if (quantity !== undefined && (typeof quantity !== "number" || quantity <= 0)) {
      return new Response(
        JSON.stringify({ error: "La quantité doit être un nombre positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (unitPrice !== undefined && (typeof unitPrice !== "number" || unitPrice <= 0)) {
      return new Response(
        JSON.stringify({ error: "Le prix unitaire doit être un nombre positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculer le nouveau sous-total
    const newQuantity = quantity !== undefined ? quantity : existingItem.quantity;
    const newUnitPrice = unitPrice !== undefined ? unitPrice : existingItem.unitPrice;
    const newSubtotal = newQuantity * newUnitPrice;
    const subtotalDifference = newSubtotal - existingItem.subtotal;

    // Mettre à jour l'article et la commande en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'article
      const orderItem = await tx.laundryOrderItem.update({
        where: { id },
        data: {
          ...(quantity !== undefined && { quantity }),
          ...(unitPrice !== undefined && { unitPrice }),
          subtotal: newSubtotal,
          ...(notes !== undefined && { notes: notes?.trim() }),
        },
        include: {
          product: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          },
        },
      });

      // Mettre à jour le total de la commande
      const newOrderSubtotal = existingItem.order.subtotal + subtotalDifference;
      const newOrderTotalAmount = newOrderSubtotal + (existingItem.order.taxes || 0) + (existingItem.order.deliveryFee || 0);

      await tx.laundryOrder.update({
        where: { id: existingItem.orderId },
        data: {
          subtotal: newOrderSubtotal,
          totalAmount: newOrderTotalAmount,
        },
      });

      return orderItem;
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer un article de commande
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

    // Vérifier les permissions
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "laundry"
        },
        canManageClients: true,
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID de l'article requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer l'article à supprimer
    const existingItem = await prisma.laundryOrderItem.findFirst({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!existingItem) {
      return new Response(
        JSON.stringify({ error: "Article non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la commande appartient au manager
    if (existingItem.order.managerId !== manager.id) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Supprimer l'article et mettre à jour la commande en transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer l'article
      await tx.laundryOrderItem.delete({
        where: { id },
      });

      // Mettre à jour le total de la commande
      const newOrderSubtotal = existingItem.order.subtotal - existingItem.subtotal;
      const newOrderTotalAmount = newOrderSubtotal + (existingItem.order.taxes || 0) + (existingItem.order.deliveryFee || 0);

      await tx.laundryOrder.update({
        where: { id: existingItem.orderId },
        data: {
          subtotal: newOrderSubtotal,
          totalAmount: newOrderTotalAmount,
        },
      });
    });

    return new Response(
      JSON.stringify({ message: "Article supprimé avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
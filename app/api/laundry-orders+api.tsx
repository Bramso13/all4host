import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer toutes les commandes de blanchisserie
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
    const status = url.searchParams.get('status');
    const clientId = url.searchParams.get('clientId');

    const whereClause: any = {
      managerId: manager.id,
    };

    if (status) {
      whereClause.status = status;
    }

    if (clientId) {
      whereClause.clientId = clientId;
    }

    const orders = await prisma.laundryOrder.findMany({
      where: whereClause,
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        manager: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        deliveryNotes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return new Response(JSON.stringify(orders), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer une nouvelle commande de blanchisserie
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

    // Vérifier les permissions pour créer des commandes
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
        JSON.stringify({ error: "Permissions insuffisantes pour gérer les commandes" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      clientId,
      pickupAddress,
      deliveryAddress,
      instructions,
      subtotal,
      taxes,
      deliveryFee,
      totalAmount,
      notes,
      status,
    } = body;

    // Validation des données obligatoires
    if (!clientId || typeof clientId !== "string") {
      return new Response(
        JSON.stringify({ error: "L'ID du client est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!deliveryAddress || typeof deliveryAddress !== "string") {
      return new Response(
        JSON.stringify({ error: "L'adresse de livraison est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof subtotal !== "number" || subtotal < 0) {
      return new Response(
        JSON.stringify({ error: "Le sous-total doit être un nombre positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof totalAmount !== "number" || totalAmount < 0) {
      return new Response(
        JSON.stringify({ error: "Le montant total doit être un nombre positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le client existe
    const client = await prisma.laundryClientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return new Response(
        JSON.stringify({ error: "Client non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Générer un numéro de commande unique
    const orderCount = await prisma.laundryOrder.count();
    const orderNumber = `LAU-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, '0')}`;

    const order = await prisma.laundryOrder.create({
      data: {
        orderNumber,
        status: status || "received",
        pickupAddress: pickupAddress?.trim(),
        deliveryAddress: deliveryAddress.trim(),
        instructions: instructions?.trim(),
        subtotal,
        taxes: taxes || 0,
        deliveryFee: deliveryFee || 0,
        totalAmount,
        notes: notes?.trim(),
        receivedByClient: false,
        managerId: manager.id,
        clientId,
        receivedDate: status === "received" || !status ? new Date() : undefined,
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        manager: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        items: {
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
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour une commande de blanchisserie
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
    const {
      id,
      pickupAddress,
      deliveryAddress,
      instructions,
      subtotal,
      taxes,
      deliveryFee,
      totalAmount,
      notes,
      status,
    } = body;

    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID de la commande requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la commande existe et appartient au manager
    const existingOrder = await prisma.laundryOrder.findFirst({
      where: {
        id,
        managerId: manager.id,
      },
    });

    if (!existingOrder) {
      return new Response(
        JSON.stringify({ error: "Commande non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const updateData: any = {};

    if (pickupAddress !== undefined) updateData.pickupAddress = pickupAddress?.trim();
    if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress.trim();
    if (instructions !== undefined) updateData.instructions = instructions?.trim();
    if (subtotal !== undefined) updateData.subtotal = subtotal;
    if (taxes !== undefined) updateData.taxes = taxes;
    if (deliveryFee !== undefined) updateData.deliveryFee = deliveryFee;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (notes !== undefined) updateData.notes = notes?.trim();

    // Gestion des dates selon le statut
    if (status && status !== existingOrder.status) {
      updateData.status = status;
      
      switch (status) {
        case "processing":
          updateData.processedDate = new Date();
          break;
        case "ready":
          updateData.readyDate = new Date();
          break;
        case "delivered":
          updateData.deliveryDate = new Date();
          break;
        case "completed":
          updateData.receivedByClient = true;
          updateData.receivedAt = new Date();
          break;
      }
    }

    const order = await prisma.laundryOrder.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(order), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer une commande de blanchisserie
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
        JSON.stringify({ error: "ID de la commande requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la commande existe et appartient au manager
    const existingOrder = await prisma.laundryOrder.findFirst({
      where: {
        id,
        managerId: manager.id,
      },
    });

    if (!existingOrder) {
      return new Response(
        JSON.stringify({ error: "Commande non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ne permettre la suppression que si la commande n'est pas en cours de traitement
    if (!["received", "cancelled"].includes(existingOrder.status)) {
      return new Response(
        JSON.stringify({ 
          error: "Impossible de supprimer une commande en cours de traitement" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer la commande et ses éléments associés en transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer les items de commande
      await tx.laundryOrderItem.deleteMany({
        where: { orderId: id },
      });

      // Supprimer les bons de livraison
      await tx.deliveryNote.deleteMany({
        where: { orderId: id },
      });

      // Supprimer la commande
      await tx.laundryOrder.delete({
        where: { id },
      });
    });

    return new Response(
      JSON.stringify({ message: "Commande supprimée avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la commande:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
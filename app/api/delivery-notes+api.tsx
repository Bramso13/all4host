import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer tous les bons de livraison
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

    const whereClause: any = {
      order: {
        managerId: manager.id,
      },
    };

    if (orderId) {
      whereClause.orderId = orderId;
    }

    const deliveryNotes = await prisma.deliveryNote.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return new Response(JSON.stringify(deliveryNotes), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des bons de livraison:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer un nouveau bon de livraison
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

    // Vérifier les permissions pour créer des bons de livraison
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
        JSON.stringify({ error: "Permissions insuffisantes pour gérer les bons de livraison" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { orderId, date, notes } = body;

    // Validation des données obligatoires
    if (!orderId || typeof orderId !== "string") {
      return new Response(
        JSON.stringify({ error: "L'ID de la commande est obligatoire" }),
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

    // Générer un numéro de bon de livraison unique
    const noteCount = await prisma.deliveryNote.count();
    const noteNumber = `BL-${new Date().getFullYear()}-${String(noteCount + 1).padStart(3, '0')}`;

    const deliveryNote = await prisma.deliveryNote.create({
      data: {
        number: noteNumber,
        date: date ? new Date(date) : new Date(),
        notes: notes?.trim(),
        orderId,
      },
      include: {
        order: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return new Response(JSON.stringify(deliveryNote), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du bon de livraison:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour un bon de livraison
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
    const { id, date, notes } = body;

    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID du bon de livraison requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le bon de livraison existe et appartient au manager
    const existingNote = await prisma.deliveryNote.findFirst({
      where: {
        id,
        order: {
          managerId: manager.id,
        },
      },
    });

    if (!existingNote) {
      return new Response(
        JSON.stringify({ error: "Bon de livraison non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const updateData: any = {};
    
    if (date !== undefined) {
      updateData.date = new Date(date);
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim();
    }

    const deliveryNote = await prisma.deliveryNote.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return new Response(JSON.stringify(deliveryNote), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du bon de livraison:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer un bon de livraison
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
        JSON.stringify({ error: "ID du bon de livraison requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le bon de livraison existe et appartient au manager
    const existingNote = await prisma.deliveryNote.findFirst({
      where: {
        id,
        order: {
          managerId: manager.id,
        },
      },
    });

    if (!existingNote) {
      return new Response(
        JSON.stringify({ error: "Bon de livraison non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    await prisma.deliveryNote.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({ message: "Bon de livraison supprimé avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du bon de livraison:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
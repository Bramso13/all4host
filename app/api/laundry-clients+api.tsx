import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer tous les clients de blanchisserie
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

    const clients = await prisma.laundryClientProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        laundryOrders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: [
        { companyName: 'asc' },
        { user: { name: 'asc' } }
      ],
    });

    return new Response(JSON.stringify(clients), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des clients:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer un nouveau client de blanchisserie
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

    // Vérifier les permissions pour créer des clients
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
        JSON.stringify({ error: "Permissions insuffisantes pour gérer les clients" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      // Données utilisateur
      name,
      email,
      phone,
      // Données profil client
      companyName,
      contactPerson,
      defaultPickupAddress,
      defaultDeliveryAddress,
      preferredPickupTime,
      specialInstructions,
      creditLimit,
      paymentTerms,
    } = body;

    // Validation des données utilisateur
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Le nom du contact est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Un email valide est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!defaultDeliveryAddress || typeof defaultDeliveryAddress !== "string") {
      return new Response(
        JSON.stringify({ error: "L'adresse de livraison est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier si un utilisateur avec cet email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Un utilisateur avec cet email existe déjà" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Créer l'utilisateur et le profil client en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          phone: phone?.trim(),
          role: "laundry_client",
          status: "active",
          emailVerified: true,
        },
      });

      // Créer le profil client
      const client = await tx.laundryClientProfile.create({
        data: {
          userId: user.id,
          companyName: companyName?.trim(),
          contactPerson: contactPerson?.trim(),
          defaultPickupAddress: defaultPickupAddress?.trim(),
          defaultDeliveryAddress: defaultDeliveryAddress.trim(),
          preferredPickupTime,
          specialInstructions: specialInstructions?.trim(),
          creditLimit: creditLimit || 0,
          paymentTerms: paymentTerms || 30,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              status: true,
            },
          },
        },
      });

      return client;
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du client:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour un client de blanchisserie
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
    const {
      id,
      // Données utilisateur
      name,
      email,
      phone,
      // Données profil client
      companyName,
      contactPerson,
      defaultPickupAddress,
      defaultDeliveryAddress,
      preferredPickupTime,
      specialInstructions,
      creditLimit,
      paymentTerms,
    } = body;

    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID du client requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le client existe
    const existingClient = await prisma.laundryClientProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingClient) {
      return new Response(
        JSON.stringify({ error: "Client non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validation de l'email si fourni
    if (email && (typeof email !== "string" || !email.includes("@"))) {
      return new Response(
        JSON.stringify({ error: "L'email doit être valide" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier l'unicité de l'email si modifié
    if (email && email.trim().toLowerCase() !== existingClient.user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (emailExists) {
        return new Response(
          JSON.stringify({ error: "Cet email est déjà utilisé" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Mettre à jour en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'utilisateur si nécessaire
      if (name !== undefined || email !== undefined || phone !== undefined) {
        const userUpdateData: any = {};
        if (name !== undefined) userUpdateData.name = name.trim();
        if (email !== undefined) userUpdateData.email = email.trim().toLowerCase();
        if (phone !== undefined) userUpdateData.phone = phone?.trim();

        await tx.user.update({
          where: { id: existingClient.userId },
          data: userUpdateData,
        });
      }

      // Mettre à jour le profil client
      const clientUpdateData: any = {};
      if (companyName !== undefined) clientUpdateData.companyName = companyName?.trim();
      if (contactPerson !== undefined) clientUpdateData.contactPerson = contactPerson?.trim();
      if (defaultPickupAddress !== undefined) clientUpdateData.defaultPickupAddress = defaultPickupAddress?.trim();
      if (defaultDeliveryAddress !== undefined) clientUpdateData.defaultDeliveryAddress = defaultDeliveryAddress.trim();
      if (preferredPickupTime !== undefined) clientUpdateData.preferredPickupTime = preferredPickupTime;
      if (specialInstructions !== undefined) clientUpdateData.specialInstructions = specialInstructions?.trim();
      if (creditLimit !== undefined) clientUpdateData.creditLimit = creditLimit;
      if (paymentTerms !== undefined) clientUpdateData.paymentTerms = paymentTerms;

      const client = await tx.laundryClientProfile.update({
        where: { id },
        data: clientUpdateData,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              status: true,
            },
          },
        },
      });

      return client;
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du client:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer un client de blanchisserie
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
        JSON.stringify({ error: "ID du client requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le client existe
    const existingClient = await prisma.laundryClientProfile.findUnique({
      where: { id },
      include: {
        laundryOrders: {
          where: {
            status: {
              notIn: ["completed", "cancelled"]
            }
          }
        }
      },
    });

    if (!existingClient) {
      return new Response(
        JSON.stringify({ error: "Client non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier s'il y a des commandes actives
    const activeOrders = await prisma.laundryOrder.findMany({
      where: { clientId: id },
    });

    if (activeOrders.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Impossible de supprimer un client avec des commandes actives"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer le client et marquer l'utilisateur comme inactif en transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer le profil client
      await tx.laundryClientProfile.delete({
        where: { id },
      });

      // Marquer l'utilisateur comme inactif
      await tx.user.update({
        where: { id: existingClient.userId },
        data: { 
          status: "inactive",
          deletedAt: new Date()
        },
      });
    });

    return new Response(
      JSON.stringify({ message: "Client supprimé avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du client:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
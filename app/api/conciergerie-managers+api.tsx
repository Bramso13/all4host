import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer tous les managers de conciergerie de l'utilisateur connecté
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

    // Récupérer les managers de conciergerie de l'utilisateur
    const managers = await prisma.conciergerieManager.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        properties: {
          include: {
            photos: true,
            reservations: true,
            tickets: true,
            payments: true,
            cleaningSessions: true,
            maintenanceSessions: true,
          },
        },
        agents: true,
        tasks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return new Response(JSON.stringify(managers), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des managers:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer un nouveau manager de conciergerie
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

    // Récupérer les données du body
    const body = await request.json();
    const { name } = body;

    // Validation des données
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Le nom est obligatoire" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier si l'utilisateur a déjà un manager de conciergerie
    const existingManager = await prisma.conciergerieManager.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (existingManager) {
      return new Response(
        JSON.stringify({ error: "Vous avez déjà un manager de conciergerie" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Créer le manager de conciergerie
    const manager = await prisma.conciergerieManager.create({
      data: {
        name: name.trim(),
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        properties: {
          include: {
            photos: true,
            reservations: true,
            tickets: true,
            payments: true,
            cleaningSessions: true,
            maintenanceSessions: true,
          },
        },
        agents: true,
        tasks: true,
      },
    });

    return new Response(JSON.stringify(manager), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du manager:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour un manager de conciergerie
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

    // Récupérer les données du body
    const body = await request.json();
    const { id, name } = body;

    // Validation des données
    if (!id || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "ID du manager requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Le nom est obligatoire" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier que le manager appartient à l'utilisateur
    const existingManager = await prisma.conciergerieManager.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingManager) {
      return new Response(
        JSON.stringify({ error: "Manager non trouvé ou accès non autorisé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Mettre à jour le manager
    const updatedManager = await prisma.conciergerieManager.update({
      where: {
        id,
      },
      data: {
        name: name.trim(),
        updatedAt: new Date(),
      },
      include: {
        properties: {
          include: {
            photos: true,
            reservations: true,
            tickets: true,
            payments: true,
            cleaningSessions: true,
            maintenanceSessions: true,
          },
        },
        agents: true,
        tasks: true,
      },
    });

    return new Response(JSON.stringify(updatedManager), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du manager:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer un manager de conciergerie
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

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Récupérer les données du body
    const body = await request.json();
    const { id } = body;

    // Validation des données
    if (!id || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "ID du manager requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier que le manager appartient à l'utilisateur
    const existingManager = await prisma.conciergerieManager.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        properties: true,
        agents: true,
        tasks: true,
      },
    });

    if (!existingManager) {
      return new Response(
        JSON.stringify({ error: "Manager non trouvé ou accès non autorisé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier s'il y a des propriétés associées
    if (existingManager.properties.length > 0) {
      return new Response(
        JSON.stringify({
          error:
            "Impossible de supprimer le manager car il a des propriétés associées. Supprimez d'abord toutes les propriétés.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer le manager (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.conciergerieManager.delete({
      where: {
        id,
      },
    });

    return new Response(
      JSON.stringify({ message: "Manager supprimé avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du manager:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

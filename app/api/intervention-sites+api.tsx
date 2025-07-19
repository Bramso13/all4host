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

    const interventionSites = await prisma.interventionSite.findMany({
      where: {
        cleaningManager: {
          userId: session.user.id,
        },
      },
      include: {
        cleaningManager: true,
        siteCleaningSessions: true,
        cleaningPlannings: true,
      },
    });

    return new Response(JSON.stringify(interventionSites), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des sites d'intervention:",
      error
    );
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
    const { name, description, client, site, surface, type, address } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Trouver le cleaning manager de l'utilisateur
    const cleaningManager = await prisma.cleaningManager.findFirst({
      where: { userId: session.user.id },
    });

    if (!cleaningManager) {
      return new Response(
        JSON.stringify({ error: "Manager de nettoyage non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const interventionSite = await prisma.interventionSite.create({
      data: {
        name,
        description,
        client,
        site,
        surface,
        type,
        address,
        cleaningManagerId: cleaningManager.id,
      },
    });

    return new Response(JSON.stringify(interventionSite), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du site d'intervention:", error);
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
    const { id, name, description, client, site, surface, type, address } =
      body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que le site appartient au manager connecté
    const existingSite = await prisma.interventionSite.findFirst({
      where: {
        id: id,
        cleaningManager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingSite) {
      return new Response(
        JSON.stringify({ error: "Site d'intervention non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const interventionSite = await prisma.interventionSite.update({
      where: { id: id },
      data: {
        name,
        description,
        client,
        site,
        surface,
        type,
        address,
      },
    });

    return new Response(JSON.stringify(interventionSite), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du site d'intervention:",
      error
    );
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

    // Vérifier que le site appartient au manager connecté
    const existingSite = await prisma.interventionSite.findFirst({
      where: {
        id: id,
        cleaningManager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingSite) {
      return new Response(
        JSON.stringify({ error: "Site d'intervention non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Supprimer le site (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.interventionSite.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({ message: "Site d'intervention supprimé avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(
      "Erreur lors de la suppression du site d'intervention:",
      error
    );
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

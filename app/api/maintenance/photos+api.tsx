import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer toutes les photos d'une session de maintenance ou d'un ticket
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

    // Vérifier si l'utilisateur a accès au pôle maintenance
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "maintenance"
        },
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Accès au pôle maintenance requis" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const ticketId = url.searchParams.get('ticketId');

    if (!sessionId && !ticketId) {
      return new Response(
        JSON.stringify({ error: "ID de session ou ID de ticket requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let photos: any[] = [];

    if (sessionId) {
      // Vérifier que la session appartient au manager
      const maintenanceSession = await prisma.maintenanceSession.findFirst({
        where: {
          id: sessionId,
          managerId: manager.id,
        },
      });

      if (!maintenanceSession) {
        return new Response(
          JSON.stringify({ error: "Session non trouvée" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      photos = await prisma.maintenancePhoto.findMany({
        where: {
          maintenanceSessionId: sessionId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }

    if (ticketId) {
      // Vérifier que le ticket appartient au manager
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          managerId: manager.id,
        },
      });

      if (!ticket) {
        return new Response(
          JSON.stringify({ error: "Ticket non trouvé" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      photos = await prisma.ticketPhoto.findMany({
        where: {
          ticketId: ticketId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }

    return new Response(JSON.stringify(photos), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des photos:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Ajouter une photo à une session de maintenance ou à un ticket
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

    // Vérifier les permissions
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "maintenance"
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
      url: photoUrl,
      type,
      caption,
      maintenanceSessionId,
      ticketId,
    } = body;

    // Validation des données obligatoires
    if (!photoUrl || typeof photoUrl !== "string" || photoUrl.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "L'URL de la photo est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!maintenanceSessionId && !ticketId) {
      return new Response(
        JSON.stringify({ error: "ID de session ou ID de ticket requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (maintenanceSessionId && ticketId) {
      return new Response(
        JSON.stringify({ error: "Spécifiez soit une session soit un ticket, pas les deux" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let photo: any;

    if (maintenanceSessionId) {
      // Vérifier que la session existe et appartient au manager
      const maintenanceSession = await prisma.maintenanceSession.findFirst({
        where: {
          id: maintenanceSessionId,
          managerId: manager.id,
        },
      });

      if (!maintenanceSession) {
        return new Response(
          JSON.stringify({ error: "Session non trouvée" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Créer la photo de session de maintenance
      photo = await prisma.maintenancePhoto.create({
        data: {
          url: photoUrl.trim(),
          type: type?.trim(),
          caption: caption?.trim(),
          maintenanceSessionId,
        },
      });
    }

    if (ticketId) {
      // Vérifier que le ticket existe et appartient au manager
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          managerId: manager.id,
        },
      });

      if (!ticket) {
        return new Response(
          JSON.stringify({ error: "Ticket non trouvé" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Créer la photo de ticket
      photo = await prisma.ticketPhoto.create({
        data: {
          url: photoUrl.trim(),
          caption: caption?.trim(),
          ticketId,
        },
      });
    }

    return new Response(JSON.stringify(photo), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la photo:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour une photo
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
          has: "maintenance"
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

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const photoType = url.searchParams.get('type'); // 'session' ou 'ticket'

    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID de la photo requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!photoType || (photoType !== 'session' && photoType !== 'ticket')) {
      return new Response(
        JSON.stringify({ error: "Type de photo requis ('session' ou 'ticket')" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();

    let photo: any;

    if (photoType === 'session') {
      // Vérifier que la photo de session existe et que la session appartient au manager
      const existingPhoto = await prisma.maintenancePhoto.findFirst({
        where: { id },
        include: {
          maintenanceSession: true,
        },
      });

      if (!existingPhoto || existingPhoto.maintenanceSession.managerId !== manager.id) {
        return new Response(
          JSON.stringify({ error: "Photo non trouvée" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Préparer les données de mise à jour
      const updateData: any = {};
      if (body.url !== undefined) updateData.url = body.url.trim();
      if (body.type !== undefined) updateData.type = body.type?.trim();
      if (body.caption !== undefined) updateData.caption = body.caption?.trim();

      photo = await prisma.maintenancePhoto.update({
        where: { id },
        data: updateData,
      });
    }

    if (photoType === 'ticket') {
      // Vérifier que la photo de ticket existe et que le ticket appartient au manager
      const existingPhoto = await prisma.ticketPhoto.findFirst({
        where: { id },
        include: {
          ticket: true,
        },
      });

      if (!existingPhoto || existingPhoto.ticket.managerId !== manager.id) {
        return new Response(
          JSON.stringify({ error: "Photo non trouvée" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Préparer les données de mise à jour
      const updateData: any = {};
      if (body.url !== undefined) updateData.url = body.url.trim();
      if (body.caption !== undefined) updateData.caption = body.caption?.trim();

      photo = await prisma.ticketPhoto.update({
        where: { id },
        data: updateData,
      });
    }

    return new Response(JSON.stringify(photo), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la photo:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer une photo
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
          has: "maintenance"
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

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const photoType = url.searchParams.get('type'); // 'session' ou 'ticket'

    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID de la photo requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!photoType || (photoType !== 'session' && photoType !== 'ticket')) {
      return new Response(
        JSON.stringify({ error: "Type de photo requis ('session' ou 'ticket')" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (photoType === 'session') {
      // Vérifier que la photo de session existe et que la session appartient au manager
      const existingPhoto = await prisma.maintenancePhoto.findFirst({
        where: { id },
        include: {
          maintenanceSession: true,
        },
      });

      if (!existingPhoto || existingPhoto.maintenanceSession.managerId !== manager.id) {
        return new Response(
          JSON.stringify({ error: "Photo non trouvée" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      await prisma.maintenancePhoto.delete({
        where: { id },
      });
    }

    if (photoType === 'ticket') {
      // Vérifier que la photo de ticket existe et que le ticket appartient au manager
      const existingPhoto = await prisma.ticketPhoto.findFirst({
        where: { id },
        include: {
          ticket: true,
        },
      });

      if (!existingPhoto || existingPhoto.ticket.managerId !== manager.id) {
        return new Response(
          JSON.stringify({ error: "Photo non trouvée" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      await prisma.ticketPhoto.delete({
        where: { id },
      });
    }

    return new Response(
      JSON.stringify({ message: "Photo supprimée avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la photo:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
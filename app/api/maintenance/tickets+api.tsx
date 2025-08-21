import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer tous les tickets de maintenance
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

    const tickets = await prisma.ticket.findMany({
      where: {
        managerId: manager.id,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        agent: {
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
        photos: true,
        maintenanceSession: {
          select: {
            id: true,
            sessionNumber: true,
            status: true,
            scheduledDate: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    return new Response(JSON.stringify(tickets), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des tickets:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer un nouveau ticket de maintenance
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
      title,
      description,
      status = "open",
      priority = "medium",
      propertyId,
      reportedBy = "manager",
      category,
      issueType,
      roomLocation,
      estimatedCost,
      estimatedDuration,
    } = body;

    // Validation des données obligatoires
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Le titre du ticket est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "La description est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!propertyId || typeof propertyId !== "string") {
      return new Response(
        JSON.stringify({ error: "L'ID de la propriété est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Générer le numéro de ticket
    const currentYear = new Date().getFullYear();
    const existingTicketsCount = await prisma.ticket.count({
      where: {
        ticketNumber: {
          startsWith: `MAINT-${currentYear}-`
        }
      }
    });
    const ticketNumber = `MAINT-${currentYear}-${String(existingTicketsCount + 1).padStart(3, '0')}`;

    // Créer le ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        propertyId,
        managerId: manager.id,
        reportedBy,
        reportedAt: new Date(),
        category: category?.trim(),
        issueType: issueType?.trim(),
        roomLocation: roomLocation?.trim(),
        estimatedCost,
        estimatedDuration,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        photos: true,
      },
    });

    return new Response(JSON.stringify(ticket), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du ticket:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour un ticket de maintenance
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

    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID du ticket requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();

    // Vérifier que le ticket existe et appartient au manager
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id,
        managerId: manager.id,
      },
    });

    if (!existingTicket) {
      return new Response(
        JSON.stringify({ error: "Ticket non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.status !== undefined) {
      updateData.status = body.status;
      // Mettre à jour les timestamps selon le statut
      if (body.status === "resolved" && !existingTicket.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.agentId !== undefined) {
      updateData.agentId = body.agentId;
      if (body.agentId && !existingTicket.assignedAt) {
        updateData.assignedAt = new Date();
        if (existingTicket.status === "open") {
          updateData.status = "assigned";
        }
      }
    }
    if (body.category !== undefined) updateData.category = body.category?.trim();
    if (body.issueType !== undefined) updateData.issueType = body.issueType?.trim();
    if (body.roomLocation !== undefined) updateData.roomLocation = body.roomLocation?.trim();
    if (body.estimatedCost !== undefined) updateData.estimatedCost = body.estimatedCost;
    if (body.estimatedDuration !== undefined) updateData.estimatedDuration = body.estimatedDuration;
    if (body.resolution !== undefined) updateData.resolution = body.resolution?.trim();

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        agent: {
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
        photos: true,
      },
    });

    return new Response(JSON.stringify(ticket), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du ticket:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer un ticket de maintenance
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

    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID du ticket requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le ticket existe et appartient au manager
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id,
        managerId: manager.id,
      },
      include: {
        maintenanceSession: true,
      },
    });

    if (!existingTicket) {
      return new Response(
        JSON.stringify({ error: "Ticket non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier s'il y a une session de maintenance associée
    if (existingTicket.maintenanceSession) {
      return new Response(
        JSON.stringify({
          error: "Impossible de supprimer un ticket avec une session de maintenance associée"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer le ticket
    await prisma.ticket.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({ message: "Ticket supprimé avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du ticket:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
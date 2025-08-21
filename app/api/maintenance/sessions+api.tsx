import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer toutes les sessions de maintenance
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

    const sessions = await prisma.maintenanceSession.findMany({
      where: {
        managerId: manager.id,
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            description: true,
            priority: true,
            category: true,
          },
        },
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
        materials: true,
        photos: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { scheduledDate: 'desc' }
      ],
    });

    return new Response(JSON.stringify(sessions), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des sessions:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer une nouvelle session de maintenance
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
        canManageAgents: true,
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes pour créer des sessions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      ticketId,
      propertyId,
      agentId,
      scheduledDate,
      startTime,
      endTime,
      status = "planned",
      estimatedDuration,
      actualDuration,
      notes,
      workDescription,
      agentNotes,
      laborCost,
      materialsCost,
      totalCost,
      ownerApproval,
      managerApproval,
    } = body;

    // Validation des données obligatoires
    if (!ticketId || typeof ticketId !== "string") {
      return new Response(
        JSON.stringify({ error: "L'ID du ticket est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!propertyId || typeof propertyId !== "string") {
      return new Response(
        JSON.stringify({ error: "L'ID de la propriété est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!agentId || typeof agentId !== "string") {
      return new Response(
        JSON.stringify({ error: "L'ID de l'agent est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!scheduledDate) {
      return new Response(
        JSON.stringify({ error: "La date prévue est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le ticket existe et n'a pas déjà de session
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { maintenanceSession: true },
    });

    if (!existingTicket) {
      return new Response(
        JSON.stringify({ error: "Ticket non trouvé" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (existingTicket.maintenanceSession) {
      return new Response(
        JSON.stringify({ error: "Ce ticket a déjà une session de maintenance associée" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Générer le numéro de session
    const currentYear = new Date().getFullYear();
    const existingSessionsCount = await prisma.maintenanceSession.count({
      where: {
        sessionNumber: {
          startsWith: `SESSION-${currentYear}-`
        }
      }
    });
    const sessionNumber = `SESSION-${currentYear}-${String(existingSessionsCount + 1).padStart(3, '0')}`;

    // Créer la session de maintenance
    const maintenanceSession = await prisma.maintenanceSession.create({
      data: {
        sessionNumber,
        ticketId,
        propertyId,
        agentId,
        managerId: manager.id,
        scheduledDate: new Date(scheduledDate),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        status,
        estimatedDuration,
        actualDuration,
        notes: notes?.trim(),
        workDescription: workDescription?.trim(),
        agentNotes: agentNotes?.trim(),
        laborCost,
        materialsCost,
        totalCost,
        ownerApproval,
        managerApproval,
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            description: true,
            priority: true,
            category: true,
          },
        },
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
        materials: true,
        photos: true,
      },
    });

    return new Response(JSON.stringify(maintenanceSession), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la session:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour une session de maintenance
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
        JSON.stringify({ error: "ID de la session requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();

    // Vérifier que la session existe et appartient au manager
    const existingSession = await prisma.maintenanceSession.findFirst({
      where: {
        id,
        managerId: manager.id,
      },
    });

    if (!existingSession) {
      return new Response(
        JSON.stringify({ error: "Session non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (body.scheduledDate !== undefined) updateData.scheduledDate = new Date(body.scheduledDate);
    if (body.startTime !== undefined) updateData.startTime = body.startTime ? new Date(body.startTime) : null;
    if (body.endTime !== undefined) updateData.endTime = body.endTime ? new Date(body.endTime) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.estimatedDuration !== undefined) updateData.estimatedDuration = body.estimatedDuration;
    if (body.actualDuration !== undefined) updateData.actualDuration = body.actualDuration;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim();
    if (body.workDescription !== undefined) updateData.workDescription = body.workDescription?.trim();
    if (body.agentNotes !== undefined) updateData.agentNotes = body.agentNotes?.trim();
    if (body.laborCost !== undefined) updateData.laborCost = body.laborCost;
    if (body.materialsCost !== undefined) updateData.materialsCost = body.materialsCost;
    if (body.totalCost !== undefined) updateData.totalCost = body.totalCost;
    if (body.ownerApproval !== undefined) updateData.ownerApproval = body.ownerApproval;
    if (body.managerApproval !== undefined) updateData.managerApproval = body.managerApproval;
    if (body.agentId !== undefined) updateData.agentId = body.agentId;

    const maintenanceSession = await prisma.maintenanceSession.update({
      where: { id },
      data: updateData,
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            description: true,
            priority: true,
            category: true,
          },
        },
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
        materials: true,
        photos: true,
      },
    });

    return new Response(JSON.stringify(maintenanceSession), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la session:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer une session de maintenance
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
        canManageAgents: true,
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
        JSON.stringify({ error: "ID de la session requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la session existe et appartient au manager
    const existingSession = await prisma.maintenanceSession.findFirst({
      where: {
        id,
        managerId: manager.id,
      },
    });

    if (!existingSession) {
      return new Response(
        JSON.stringify({ error: "Session non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier si la session est en cours ou terminée
    if (existingSession.status === "in_progress" || existingSession.status === "completed") {
      return new Response(
        JSON.stringify({
          error: "Impossible de supprimer une session en cours ou terminée"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer la session de maintenance en transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer les matériaux et photos associés
      await tx.maintenanceMaterial.deleteMany({
        where: { maintenanceSessionId: id },
      });
      
      await tx.maintenancePhoto.deleteMany({
        where: { maintenanceSessionId: id },
      });

      // Supprimer la session
      await tx.maintenanceSession.delete({
        where: { id },
      });
    });

    return new Response(
      JSON.stringify({ message: "Session supprimée avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la session:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer les contrats (pour manager ou propriétaire)
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

    const url = new URL(request.url);
    const contractId = url.searchParams.get("id");
    const propertyOwnerId = url.searchParams.get("propertyOwnerId");
    const propertyId = url.searchParams.get("propertyId");

    // Récupérer l'utilisateur pour connaître son rôle
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Si l'utilisateur est un propriétaire
    if (user.role === "property_owner") {
      // Récupérer son profil de propriétaire
      const propertyOwnerProfile = await prisma.propertyOwnerProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!propertyOwnerProfile) {
        return new Response(JSON.stringify({ error: "Profil propriétaire non trouvé" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Si un contrat spécifique est demandé
      if (contractId) {
        const contract = await prisma.propertyContract.findFirst({
          where: {
            id: contractId,
            propertyOwnerId: propertyOwnerProfile.id, // Sécurité: seulement ses contrats
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
          },
        });

        if (!contract) {
          return new Response(JSON.stringify({ error: "Contrat non trouvé" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(contract), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Filtres pour propriétaire
      let whereClause: any = {
        propertyOwnerId: propertyOwnerProfile.id,
      };

      if (propertyId) {
        // Vérifier que la propriété appartient au propriétaire
        const property = await prisma.property.findFirst({
          where: {
            id: propertyId,
            ownerId: propertyOwnerProfile.id,
          },
        });

        if (!property) {
          return new Response(JSON.stringify({ error: "Propriété non trouvée" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        whereClause.propertyId = propertyId;
      }

      const contracts = await prisma.propertyContract.findMany({
        where: whereClause,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return new Response(JSON.stringify(contracts), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pour les managers (comportement pour la gestion des contrats par le manager)
    const manager = await prisma.poleManagerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Profil manager non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Filtres pour manager
    let whereClause: any = {};

    if (contractId) {
      whereClause.id = contractId;
    }

    if (propertyOwnerId) {
      whereClause.propertyOwnerId = propertyOwnerId;
    }

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    const contracts = await prisma.propertyContract.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        propertyOwner: {
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return new Response(JSON.stringify(contracts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des contrats:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer un nouveau contrat (managers seulement)
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

    // Vérifier que l'utilisateur est un manager (les propriétaires ne peuvent pas créer de contrats)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "pole_manager") {
      return new Response(
        JSON.stringify({ error: "Seuls les managers peuvent créer des contrats" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const manager = await prisma.poleManagerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Profil manager non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      contractNumber,
      type,
      status,
      startDate,
      endDate,
      propertyId,
      propertyOwnerId,
      monthlyFee,
      commissionRate,
      documentUrl,
      signedAt,
    } = body;

    // Validation des données obligatoires
    if (!contractNumber || !type || !startDate || !propertyId || !propertyOwnerId) {
      return new Response(
        JSON.stringify({
          error: "Les champs contractNumber, type, startDate, propertyId et propertyOwnerId sont obligatoires",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la propriété et le propriétaire existent
    const [property, propertyOwner] = await Promise.all([
      prisma.property.findUnique({ where: { id: propertyId } }),
      prisma.propertyOwnerProfile.findUnique({ where: { id: propertyOwnerId } }),
    ]);

    if (!property) {
      return new Response(
        JSON.stringify({ error: "Propriété non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!propertyOwner) {
      return new Response(
        JSON.stringify({ error: "Propriétaire non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la propriété appartient au propriétaire
    if (property.ownerId !== propertyOwnerId) {
      return new Response(
        JSON.stringify({ error: "La propriété n'appartient pas à ce propriétaire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier l'unicité du numéro de contrat
    const existingContract = await prisma.propertyContract.findUnique({
      where: { contractNumber },
    });

    if (existingContract) {
      return new Response(
        JSON.stringify({ error: "Ce numéro de contrat existe déjà" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const contract = await prisma.propertyContract.create({
      data: {
        contractNumber,
        type,
        status: status || "active",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        propertyId,
        propertyOwnerId,
        monthlyFee,
        commissionRate,
        documentUrl,
        signedAt: signedAt ? new Date(signedAt) : null,
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
        propertyOwner: {
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
      },
    });

    return new Response(JSON.stringify(contract), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erreur lors de la création du contrat:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour un contrat (managers seulement)
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

    // Vérifier que l'utilisateur est un manager
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "pole_manager") {
      return new Response(
        JSON.stringify({ error: "Seuls les managers peuvent modifier des contrats" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(request.url);
    const contractId = url.searchParams.get("id");
    const body = await request.json();

    if (!contractId) {
      return new Response(
        JSON.stringify({ error: "ID du contrat requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le contrat existe
    const existingContract = await prisma.propertyContract.findUnique({
      where: { id: contractId },
    });

    if (!existingContract) {
      return new Response(
        JSON.stringify({ error: "Contrat non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (body.contractNumber !== undefined) updateData.contractNumber = body.contractNumber;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.monthlyFee !== undefined) updateData.monthlyFee = body.monthlyFee;
    if (body.commissionRate !== undefined) updateData.commissionRate = body.commissionRate;
    if (body.documentUrl !== undefined) updateData.documentUrl = body.documentUrl;
    if (body.signedAt !== undefined) updateData.signedAt = body.signedAt ? new Date(body.signedAt) : null;

    const updatedContract = await prisma.propertyContract.update({
      where: { id: contractId },
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
        propertyOwner: {
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
      },
    });

    return new Response(JSON.stringify(updatedContract), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du contrat:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer un contrat (managers seulement)
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

    // Vérifier que l'utilisateur est un manager
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "pole_manager") {
      return new Response(
        JSON.stringify({ error: "Seuls les managers peuvent supprimer des contrats" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(request.url);
    const contractId = url.searchParams.get("id");

    if (!contractId) {
      return new Response(
        JSON.stringify({ error: "ID du contrat requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le contrat existe
    const existingContract = await prisma.propertyContract.findUnique({
      where: { id: contractId },
    });

    if (!existingContract) {
      return new Response(
        JSON.stringify({ error: "Contrat non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer le contrat
    await prisma.propertyContract.delete({
      where: { id: contractId },
    });

    return new Response(
      JSON.stringify({ message: "Contrat supprimé avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Erreur lors de la suppression du contrat:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
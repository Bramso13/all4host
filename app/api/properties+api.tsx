import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer les propriétés du manager connecté
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

    // Récupérer le manager profile de l'utilisateur connecté
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

    // Vérifier que le manager a les droits pour le pôle conciergerie
    if (!manager.poleTypes.includes("conciergerie")) {
      return new Response(
        JSON.stringify({ error: "Accès non autorisé au pôle conciergerie" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const properties = await prisma.property.findMany({
      where: {
        managerId: manager.id,
      },
      include: {
        owner: {
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
                phone: true,
              },
            },
          },
        },
        features: true,
        photos: true,
        reviews: true,
        contracts: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return new Response(JSON.stringify(properties), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer une nouvelle propriété
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

    // Récupérer le manager profile de l'utilisateur connecté
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

    // Vérifier que le manager a les droits pour le pôle conciergerie
    if (!manager.poleTypes.includes("conciergerie")) {
      return new Response(
        JSON.stringify({ error: "Accès non autorisé au pôle conciergerie" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      status,
      address,
      city,
      country,
      postalCode,
      latitude,
      longitude,
      surface,
      numberOfRooms,
      numberOfBedrooms,
      numberOfBathrooms,
      maxGuests,
      floor,
      hasElevator,
      hasParking,
      hasBalcony,
      pricePerNight,
      cleaningFee,
      serviceFee,
      securityDeposit,
      checkInTime,
      checkOutTime,
      cancellationPolicy,
      houseRules,
      accessInstructions,
      cleaningInstructions,
      maintenanceNotes,
      ownerId,
    } = body;

    // Validation des données obligatoires
    if (!name || !address || !city || !ownerId) {
      return new Response(
        JSON.stringify({ 
          error: "Les champs name, address, city et ownerId sont obligatoires" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le propriétaire existe
    const owner = await prisma.propertyOwnerProfile.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return new Response(
        JSON.stringify({ error: "Propriétaire non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const property = await prisma.property.create({
      data: {
        name,
        description: description || "",
        status: status || "available",
        address,
        city,
        country: country || "France",
        postalCode,
        latitude,
        longitude,
        surface,
        numberOfRooms,
        numberOfBedrooms,
        numberOfBathrooms,
        maxGuests,
        floor,
        hasElevator: hasElevator || false,
        hasParking: hasParking || false,
        hasBalcony: hasBalcony || false,
        pricePerNight,
        cleaningFee,
        serviceFee,
        securityDeposit,
        averageRating: 0,
        totalReviews: 0,
        checkInTime: checkInTime || "15:00",
        checkOutTime: checkOutTime || "11:00",
        cancellationPolicy,
        houseRules,
        accessInstructions,
        cleaningInstructions,
        maintenanceNotes,
        ownerId,
        managerId: manager.id,
      },
      include: {
        owner: {
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
                phone: true,
              },
            },
          },
        },
      },
    });

    return new Response(JSON.stringify(property), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la propriété:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour une propriété
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

    const body = await request.json();
    const { id, ...updateData } = body;

    // Validation des données
    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID de la propriété requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer le manager profile de l'utilisateur connecté
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

    // Vérifier que la propriété appartient au manager
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        managerId: manager.id,
      },
    });

    if (!existingProperty) {
      return new Response(
        JSON.stringify({ error: "Propriété non trouvée" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updatedProperty = await prisma.property.update({
      where: { id: id },
      data: updateData,
      include: {
        owner: {
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
                phone: true,
              },
            },
          },
        },
      },
    });

    return new Response(JSON.stringify(updatedProperty), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la propriété:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer une propriété
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

    const body = await request.json();
    const { id } = body;

    // Validation des données
    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID de la propriété requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer le manager profile de l'utilisateur connecté
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

    // Vérifier que la propriété appartient au manager
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        managerId: manager.id,
      },
      include: {
        reservations: true,
        cleaningSessions: true,
        maintenanceSessions: true,
        tickets: true,
      },
    });

    if (!existingProperty) {
      return new Response(
        JSON.stringify({ error: "Propriété non trouvée" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier qu'il n'y a pas de réservations actives
    const activeReservations = existingProperty.reservations.filter(
      (r) => r.status === "confirmed" || r.status === "in_progress" || r.status === "checked_in"
    );

    if (activeReservations.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Impossible de supprimer une propriété avec des réservations actives"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer la propriété (cascade pour les relations)
    await prisma.property.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({ message: "Propriété supprimée avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la propriété:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

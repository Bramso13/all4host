import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer les propriétaires (manager) ou son propre profil (propriétaire)
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
    const profileId = url.searchParams.get("id");

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

    // Si l'utilisateur est un propriétaire, il ne peut accéder qu'à son propre profil
    if (user.role === "property_owner") {
      // Si un ID spécifique est demandé et que ce n'est pas le sien, refuser
      if (profileId) {
        const requestedProfile = await prisma.propertyOwnerProfile.findUnique({
          where: { id: profileId },
          select: { userId: true },
        });

        if (!requestedProfile || requestedProfile.userId !== session.user.id) {
          return new Response(JSON.stringify({ error: "Accès refusé" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Récupérer son propre profil
      const profile = await prisma.propertyOwnerProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // Si le profil n'existe pas, retourner un tableau vide
      if (!profile) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify([profile]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pour les managers (comportement original)
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

    // Récupérer tous les propriétaires ayant des propriétés gérées par ce manager
    const propertyOwners = await prisma.propertyOwnerProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        properties: {
          where: {
            managerId: manager.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return new Response(JSON.stringify(propertyOwners), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétaires:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer un nouveau propriétaire
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
      userId,
      company,
      taxNumber,
      address,
      city,
      country,
      postal,
      preferredContactMethod,
      receiveNotifications,
      // Pour créer l'utilisateur si nécessaire
      name,
      email,
      phone,
    } = body;

    // Si userId n'est pas fourni, créer un nouvel utilisateur
    let targetUserId = userId;
    if (!targetUserId) {
      if (!name || !email) {
        return new Response(
          JSON.stringify({
            error:
              "Les champs name et email sont obligatoires pour créer un nouvel utilisateur",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Vérifier si un utilisateur avec cet email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (existingUser) {
        targetUserId = existingUser.id;

        // Vérifier si cet utilisateur a déjà un profil propriétaire
        const existingOwner = await prisma.propertyOwnerProfile.findUnique({
          where: { userId: existingUser.id },
        });

        if (existingOwner) {
          return new Response(
            JSON.stringify({
              error: "Cet utilisateur a déjà un profil de propriétaire",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      } else {
        // Créer un nouvel utilisateur avec auth.api.signUpEmail
        const user = await auth.api.signUpEmail({
          body: {
            email: email.trim().toLowerCase(),
            password: "password",
            // password: crypto.randomUUID(),
            name: name,
          },
        });

        if (!user.user) {
          return new Response(
            JSON.stringify({
              error: "Erreur lors de la création de l'utilisateur",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        // Mettre à jour le rôle et les autres informations
        const updatedUser = await prisma.user.update({
          where: { id: user.user.id },
          data: {
            role: "property_owner",
            phone: phone,
            status: "active",
          },
        });

        targetUserId = updatedUser.id;
      }
    }

    // Validation des données obligatoires
    if (!address || !city) {
      return new Response(
        JSON.stringify({
          error: "Les champs address et city sont obligatoires",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const propertyOwner = await prisma.propertyOwnerProfile.create({
      data: {
        userId: targetUserId,
        company,
        taxNumber,
        address,
        city,
        country: country || "France",
        postal,
        preferredContactMethod: preferredContactMethod || "email",
        receiveNotifications: receiveNotifications ?? true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(propertyOwner), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du propriétaire:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour un propriétaire (manager) ou son propre profil (propriétaire)
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

    const url = new URL(request.url);
    const profileId = url.searchParams.get("id");
    const body = await request.json();

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
      if (!profileId) {
        return new Response(JSON.stringify({ error: "ID du profil requis" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Vérifier que le propriétaire peut modifier ce profil (seulement le sien)
      const existingProfile = await prisma.propertyOwnerProfile.findUnique({
        where: { 
          id: profileId,
          userId: session.user.id // Sécurité : seulement son propre profil
        },
      });

      if (!existingProfile) {
        return new Response(JSON.stringify({ error: "Profil non trouvé ou accès refusé" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Mettre à jour le profil (seulement certains champs autorisés pour un propriétaire)
      const allowedFields = {
        company: body.company,
        taxNumber: body.taxNumber,
        address: body.address,
        city: body.city,
        country: body.country,
        postal: body.postal,
        preferredContactMethod: body.preferredContactMethod,
        receiveNotifications: body.receiveNotifications,
        updatedAt: new Date(),
      };

      const updatedProfile = await prisma.propertyOwnerProfile.update({
        where: { id: profileId },
        data: allowedFields,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      return new Response(JSON.stringify(updatedProfile), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pour les managers (comportement original)
    const { id, ...updateData } = body;

    // Validation des données
    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID du propriétaire requis" }),
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

    // Vérifier que le propriétaire existe
    const existingOwner = await prisma.propertyOwnerProfile.findUnique({
      where: { id: id },
    });

    if (!existingOwner) {
      return new Response(
        JSON.stringify({ error: "Propriétaire non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updatedOwner = await prisma.propertyOwnerProfile.update({
      where: { id: id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(updatedOwner), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du propriétaire:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer un propriétaire
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
        JSON.stringify({ error: "ID du propriétaire requis" }),
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

    // Vérifier que le propriétaire existe et qu'il n'a pas de propriétés
    const existingOwner = await prisma.propertyOwnerProfile.findUnique({
      where: { id: id },
      include: {
        properties: true,
      },
    });

    if (!existingOwner) {
      return new Response(
        JSON.stringify({ error: "Propriétaire non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier qu'il n'y a pas de propriétés associées
    if (existingOwner.properties.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Impossible de supprimer un propriétaire ayant des propriétés",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer le propriétaire
    await prisma.propertyOwnerProfile.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({ message: "Propriétaire supprimé avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du propriétaire:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

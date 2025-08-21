import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer le pole manager profile de l'utilisateur connecté (super_admin)
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

    // Vérifier si l'utilisateur est un super admin
    if (session.user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Accès réservé aux super admins" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer le pole manager profile de l'utilisateur super admin
    const manager = await prisma.poleManagerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        superAdmin: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        properties: {
          include: {
            owner: {
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
        managedAgents: {
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
    });

    return new Response(JSON.stringify(manager), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du manager:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer un nouveau pole manager profile
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
    const {
      forAdmin,
      poleTypes,
      canViewAnalytics,
      canManageAgents,
      canManageClients,
      canManageBilling,
      // Pour le mode normal (création d'un manager pour quelqu'un d'autre)
      name,
      firstName,
      lastName,
      email,
      phone,
    } = body;

    // Validation des données communes
    if (!poleTypes || !Array.isArray(poleTypes) || poleTypes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Au moins un pôle doit être sélectionné" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que tous les poleTypes sont valides
    const validPoleTypes = [
      "conciergerie",
      "cleaning",
      "maintenance",
      "laundry",
    ];
    const invalidPoleTypes = poleTypes.filter(
      (type) => !validPoleTypes.includes(type)
    );
    if (invalidPoleTypes.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Types de pôle invalides: ${invalidPoleTypes.join(", ")}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (forAdmin) {
      // Mode admin : créer un PoleManagerProfile pour l'utilisateur connecté

      // Vérifier si l'utilisateur a déjà un PoleManagerProfile
      const existingManager = await prisma.poleManagerProfile.findUnique({
        where: {
          userId: session.user.id,
        },
      });

      if (existingManager) {
        return new Response(
          JSON.stringify({
            error: "Vous avez déjà un profil de manager activé",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (session.user.role !== "super_admin") {
        return new Response(
          JSON.stringify({
            error:
              "Vous devez être un super admin pour activer des droits de manager",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      // Créer le super admin profile
      const superAdminProfile = await prisma.superAdminProfile.create({
        data: {
          userId: session.user.id,
          companyName: "Super Admin",
          billingAddress: "123 Main St",
          billingCity: "Anytown",
          billingPostal: "12345",
          billingCountry: "USA",
        },
        include: {
          user: true,
        },
      });

      // TODO: Vérifier les abonnements aux pôles et la facturation
      // Pour chaque pôle sélectionné, vérifier que l'admin a un abonnement actif
      // et créer les lignes de facturation si nécessaire

      // Créer le PoleManagerProfile pour l'admin
      const manager = await prisma.poleManagerProfile.create({
        data: {
          userId: session.user.id,
          poleTypes,
          canViewAnalytics: canViewAnalytics ?? true,
          canManageAgents: canManageAgents ?? true,
          canManageClients: canManageClients ?? false,
          canManageBilling: canManageBilling ?? false,
          superAdminId: superAdminProfile.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          superAdmin: true,
        },
      });

      return new Response(JSON.stringify(manager), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Mode normal : créer un manager pour quelqu'un d'autre

      // Validation des données pour le mode normal
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Le nom est obligatoire" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return new Response(
          JSON.stringify({ error: "Un email valide est obligatoire" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Vérifier si l'utilisateur connecté est un super admin
      const superAdminProfile = await prisma.superAdminProfile.findUnique({
        where: {
          userId: session.user.id,
        },
      });

      if (!superAdminProfile) {
        return new Response(
          JSON.stringify({
            error: "Seuls les super admins peuvent créer des managers",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      // Vérifier si un utilisateur avec cet email existe déjà
      let targetUser: any = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (!targetUser) {
        const user = await auth.api.signUpEmail({
          body: {
            email: email.trim().toLowerCase(),
            password: crypto.randomUUID(),
            name: `${firstName} ${lastName}`,
          },
        });
        targetUser = user.user;
      } else {
        // Vérifier si cet utilisateur a déjà un PoleManagerProfile
        const existingManager = await prisma.poleManagerProfile.findUnique({
          where: {
            userId: targetUser.id,
          },
        });

        if (existingManager) {
          return new Response(
            JSON.stringify({
              error: "Cet utilisateur a déjà un profil de manager",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      if (!targetUser) {
        return new Response(
          JSON.stringify({
            error: "Erreur lors de la création de l'utilisateur",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Créer le PoleManagerProfile
      const manager = await prisma.poleManagerProfile.create({
        data: {
          userId: targetUser.id,
          poleTypes,
          canViewAnalytics: canViewAnalytics ?? true,
          canManageAgents: canManageAgents ?? true,
          canManageClients: canManageClients ?? false,
          canManageBilling: canManageBilling ?? false,
          superAdminId: superAdminProfile.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          superAdmin: true,
        },
      });

      return new Response(JSON.stringify(manager), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Erreur lors de la création du manager:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour un pole manager profile
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
    const {
      id,
      poleTypes,
      canViewAnalytics,
      canManageAgents,
      canManageClients,
      canManageBilling,
    } = body;

    // Validation des données
    if (!id || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "ID du manager requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier que le manager existe et que l'utilisateur a le droit de le modifier
    const existingManager = await prisma.poleManagerProfile.findUnique({
      where: { id },
      include: {
        superAdmin: true,
      },
    });

    if (!existingManager) {
      return new Response(JSON.stringify({ error: "Manager non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier les droits : soit c'est son propre profil, soit il est le super admin qui l'a créé
    const isSelfUpdate = existingManager.userId === session.user.id;
    const isSuperAdminUpdate =
      existingManager.superAdmin.userId === session.user.id;

    if (!isSelfUpdate && !isSuperAdminUpdate) {
      return new Response(JSON.stringify({ error: "Accès non autorisé" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mettre à jour le manager
    const updatedManager = await prisma.poleManagerProfile.update({
      where: { id },
      data: {
        ...(poleTypes && { poleTypes }),
        ...(typeof canViewAnalytics === "boolean" && { canViewAnalytics }),
        ...(typeof canManageAgents === "boolean" && { canManageAgents }),
        ...(typeof canManageClients === "boolean" && { canManageClients }),
        ...(typeof canManageBilling === "boolean" && { canManageBilling }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        superAdmin: true,
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

// DELETE - Supprimer un pole manager profile
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

    // Vérifier que le manager existe et que l'utilisateur a le droit de le supprimer
    const existingManager = await prisma.poleManagerProfile.findUnique({
      where: { id },
      include: {
        superAdmin: true,
        properties: true,
        managedAgents: true,
      },
    });

    if (!existingManager) {
      return new Response(JSON.stringify({ error: "Manager non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier les droits : soit c'est son propre profil, soit il est le super admin qui l'a créé
    const isSelfDelete = existingManager.userId === session.user.id;
    const isSuperAdminDelete =
      existingManager.superAdmin.userId === session.user.id;

    if (!isSelfDelete && !isSuperAdminDelete) {
      return new Response(JSON.stringify({ error: "Accès non autorisé" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier s'il y a des propriétés ou agents associés
    if (existingManager.properties.length > 0) {
      return new Response(
        JSON.stringify({
          error:
            "Impossible de supprimer le manager car il a des propriétés associées.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (existingManager.managedAgents.length > 0) {
      return new Response(
        JSON.stringify({
          error:
            "Impossible de supprimer le manager car il a des agents associés.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer le manager
    await prisma.poleManagerProfile.delete({
      where: { id },
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

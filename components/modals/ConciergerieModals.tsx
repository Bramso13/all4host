import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";

export const CreateManagerModal = ({
  forAdmin = false,

  onClose,
  onCreateManager,
}: {
  forAdmin?: boolean;

  onClose: () => void;
  onCreateManager: (managerData: any) => Promise<boolean>;
}) => {
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPoleTypes, setSelectedPoleTypes] = useState<string[]>([]);
  const [canViewAnalytics, setCanViewAnalytics] = useState(true);
  const [canManageAgents, setCanManageAgents] = useState(true);
  const [canManageClients, setCanManageClients] = useState(false);
  const [canManageBilling, setCanManageBilling] = useState(false);

  const poleTypes = [
    { key: "conciergerie", label: "Conciergerie", icon: "🏨" },
    { key: "cleaning", label: "Nettoyage", icon: "🧹" },
    { key: "maintenance", label: "Maintenance", icon: "🔧" },
    { key: "laundry", label: "Blanchisserie", icon: "👕" },
  ];

  const togglePoleType = (poleType: string) => {
    setSelectedPoleTypes((prev) =>
      prev.includes(poleType)
        ? prev.filter((type) => type !== poleType)
        : [...prev, poleType]
    );
  };

  const handleSubmit = async () => {
    if (forAdmin) {
      // Mode admin : créer un PoleManagerProfile pour l'utilisateur connecté
      const adminManagerData = {
        forAdmin: true,
        poleTypes: selectedPoleTypes,
        canViewAnalytics,
        canManageAgents,
        canManageClients,
        canManageBilling,
      };
      const result = await onCreateManager(adminManagerData);
      if (result) {
        onClose();
      }
    } else {
      // Mode normal : créer un manager pour quelqu'un d'autre
      const managerData = {
        forAdmin: false,
        name,
        firstName,
        lastName,
        email,
        phone,
        poleTypes: selectedPoleTypes,
        canViewAnalytics,
        canManageAgents,
        canManageClients,
        canManageBilling,
      };
      onCreateManager(managerData);
    }

    setName("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setSelectedPoleTypes([]);
    setCanViewAnalytics(true);
    setCanManageAgents(true);
    setCanManageClients(false);
    setCanManageBilling(false);
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          {forAdmin ? "Activer mes droits Manager" : "Créer un Manager"}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        {!forAdmin && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Jean Dupont"
                placeholderTextColor="#C7C7CC"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Prénom</Text>
                <TextInput
                  style={styles.textInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Jean"
                  placeholderTextColor="#C7C7CC"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Nom</Text>
                <TextInput
                  style={styles.textInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Dupont"
                  placeholderTextColor="#C7C7CC"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="jean.dupont@example.com"
                placeholderTextColor="#C7C7CC"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor="#C7C7CC"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {forAdmin && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Activation des droits Manager
            </Text>
            <Text style={styles.sectionSubtitle}>
              Vous allez activer vos droits de manager pour les pôles
              sélectionnés. Chaque pôle activé sera facturé selon votre plan
              d'abonnement.
            </Text>
          </View>
        )}

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Pôles gérés *</Text>
          <Text style={styles.sectionSubtitle}>
            Sélectionnez un ou plusieurs pôles
          </Text>

          <View style={styles.poleTypesContainer}>
            {poleTypes.map((poleType) => (
              <TouchableOpacity
                key={poleType.key}
                style={[
                  styles.poleTypeOption,
                  selectedPoleTypes.includes(poleType.key) &&
                    styles.poleTypeOptionSelected,
                ]}
                onPress={() => togglePoleType(poleType.key)}
              >
                <Text style={styles.poleTypeIcon}>{poleType.icon}</Text>
                <Text
                  style={[
                    styles.poleTypeText,
                    selectedPoleTypes.includes(poleType.key) &&
                      styles.poleTypeTextSelected,
                  ]}
                >
                  {poleType.label}
                </Text>
                <View
                  style={[
                    styles.checkbox,
                    selectedPoleTypes.includes(poleType.key) &&
                      styles.checkboxSelected,
                  ]}
                >
                  {selectedPoleTypes.includes(poleType.key) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Permissions</Text>

          <TouchableOpacity
            style={styles.permissionItem}
            onPress={() => setCanViewAnalytics(!canViewAnalytics)}
          >
            <Text style={styles.permissionLabel}>Voir les analyses</Text>
            <View
              style={[styles.switch, canViewAnalytics && styles.switchActive]}
            >
              <View
                style={[
                  styles.switchThumb,
                  canViewAnalytics && styles.switchThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionItem}
            onPress={() => setCanManageAgents(!canManageAgents)}
          >
            <Text style={styles.permissionLabel}>Gérer les agents</Text>
            <View
              style={[styles.switch, canManageAgents && styles.switchActive]}
            >
              <View
                style={[
                  styles.switchThumb,
                  canManageAgents && styles.switchThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionItem}
            onPress={() => setCanManageClients(!canManageClients)}
          >
            <Text style={styles.permissionLabel}>Gérer les clients</Text>
            <View
              style={[styles.switch, canManageClients && styles.switchActive]}
            >
              <View
                style={[
                  styles.switchThumb,
                  canManageClients && styles.switchThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionItem}
            onPress={() => setCanManageBilling(!canManageBilling)}
          >
            <Text style={styles.permissionLabel}>Gérer la facturation</Text>
            <View
              style={[styles.switch, canManageBilling && styles.switchActive]}
            >
              <View
                style={[
                  styles.switchThumb,
                  canManageBilling && styles.switchThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.createButton,
            (forAdmin
              ? selectedPoleTypes.length === 0
              : !name || !email || selectedPoleTypes.length === 0) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            forAdmin
              ? selectedPoleTypes.length === 0
              : !name || !email || selectedPoleTypes.length === 0
          }
        >
          <Text style={styles.createButtonText}>
            {forAdmin ? "Activer" : "Créer"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const CreatePropertyModal = ({
  visible,
  onClose,
  onCreateProperty,
  onCreatePropertyOwner,
  propertyOwners = [],
}: {
  visible: boolean;
  onClose: () => void;
  onCreateProperty: (propertyData: any) => Promise<void>;
  onCreatePropertyOwner?: (ownerData: any) => Promise<any>;
  propertyOwners?: any[];
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [numberOfRooms, setNumberOfRooms] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [createNewOwner, setCreateNewOwner] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // States pour créer un nouveau propriétaire
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerCompany, setOwnerCompany] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [ownerCity, setOwnerCity] = useState("");
  const [ownerPostal, setOwnerPostal] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setAddress("");
    setCity("");
    setPostalCode("");
    setPricePerNight("");
    setNumberOfRooms("");
    setMaxGuests("");
    setOwnerId("");
    setCreateNewOwner(false);
    setOwnerName("");
    setOwnerEmail("");
    setOwnerPhone("");
    setOwnerCompany("");
    setOwnerAddress("");
    setOwnerCity("");
    setOwnerPostal("");
  };

  const handleSubmit = async () => {
    if (!name || !address || !city) {
      alert("Veuillez remplir tous les champs obligatoires de la propriété");
      return;
    }

    if (!createNewOwner && !ownerId) {
      alert("Veuillez sélectionner un propriétaire ou créer un nouveau propriétaire");
      return;
    }

    if (createNewOwner && (!ownerName || !ownerEmail || !ownerAddress || !ownerCity)) {
      alert("Veuillez remplir tous les champs obligatoires du propriétaire");
      return;
    }

    setIsCreating(true);
    try {
      let finalOwnerId = ownerId;
      
      // Créer le propriétaire d'abord si nécessaire
      if (createNewOwner && onCreatePropertyOwner) {
        const ownerData = {
          name: ownerName,
          email: ownerEmail,
          phone: ownerPhone || undefined,
          company: ownerCompany || undefined,
          address: ownerAddress,
          city: ownerCity,
          postal: ownerPostal || undefined,
          country: "France",
          preferredContactMethod: "email",
          receiveNotifications: true,
        };
        
        const newOwner = await onCreatePropertyOwner(ownerData);
        finalOwnerId = newOwner.id;
      }

      const propertyData = {
        name,
        description,
        address,
        city,
        postalCode,
        pricePerNight: pricePerNight ? parseFloat(pricePerNight) : undefined,
        numberOfRooms: numberOfRooms ? parseInt(numberOfRooms) : undefined,
        maxGuests: maxGuests ? parseInt(maxGuests) : undefined,
        ownerId: finalOwnerId,
      };
      
      await onCreateProperty(propertyData);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      alert("Erreur lors de la création. Veuillez réessayer.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Créer une Propriété</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informations générales</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom de la propriété *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Appartement centre-ville"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description de la propriété..."
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Localisation</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Adresse *</Text>
            <TextInput
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Rue de la Paix"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Ville *</Text>
              <TextInput
                style={styles.textInput}
                value={city}
                onChangeText={setCity}
                placeholder="Paris"
                placeholderTextColor="#C7C7CC"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Code postal</Text>
              <TextInput
                style={styles.textInput}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="75001"
                placeholderTextColor="#C7C7CC"
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Propriétaire</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sélection du propriétaire *</Text>
            <View style={styles.ownerTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.ownerTypeOption,
                  !createNewOwner && styles.ownerTypeOptionSelected,
                ]}
                onPress={() => setCreateNewOwner(false)}
              >
                <Text style={[
                  styles.ownerTypeText,
                  !createNewOwner && styles.ownerTypeTextSelected,
                ]}>
                  Sélectionner existant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ownerTypeOption,
                  createNewOwner && styles.ownerTypeOptionSelected,
                ]}
                onPress={() => setCreateNewOwner(true)}
              >
                <Text style={[
                  styles.ownerTypeText,
                  createNewOwner && styles.ownerTypeTextSelected,
                ]}>
                  Créer nouveau
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!createNewOwner ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Propriétaire existant *</Text>
              <TouchableOpacity style={styles.textInput}>
                <Text style={[
                  styles.inputPlaceholder,
                  ownerId && { color: "#1C1C1E" }
                ]}>
                  {ownerId 
                    ? propertyOwners.find(o => o.id === ownerId)?.user?.name || "Sélectionné"
                    : "Sélectionner un propriétaire"
                  }
                </Text>
              </TouchableOpacity>
              
              {propertyOwners.length > 0 && (
                <View style={styles.ownersList}>
                  {propertyOwners.map((owner) => (
                    <TouchableOpacity
                      key={owner.id}
                      style={[
                        styles.ownerItem,
                        ownerId === owner.id && styles.ownerItemSelected,
                      ]}
                      onPress={() => setOwnerId(owner.id)}
                    >
                      <Text style={styles.ownerName}>{owner.user?.name}</Text>
                      <Text style={styles.ownerEmail}>{owner.user?.email}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom complet *</Text>
                <TextInput
                  style={styles.textInput}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="Jean Dupont"
                  placeholderTextColor="#C7C7CC"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.textInput}
                  value={ownerEmail}
                  onChangeText={setOwnerEmail}
                  placeholder="jean.dupont@example.com"
                  placeholderTextColor="#C7C7CC"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Téléphone</Text>
                  <TextInput
                    style={styles.textInput}
                    value={ownerPhone}
                    onChangeText={setOwnerPhone}
                    placeholder="+33 6 12 34 56 78"
                    placeholderTextColor="#C7C7CC"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Société</Text>
                  <TextInput
                    style={styles.textInput}
                    value={ownerCompany}
                    onChangeText={setOwnerCompany}
                    placeholder="Nom de la société"
                    placeholderTextColor="#C7C7CC"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adresse *</Text>
                <TextInput
                  style={styles.textInput}
                  value={ownerAddress}
                  onChangeText={setOwnerAddress}
                  placeholder="123 Rue de la Paix"
                  placeholderTextColor="#C7C7CC"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Ville *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={ownerCity}
                    onChangeText={setOwnerCity}
                    placeholder="Paris"
                    placeholderTextColor="#C7C7CC"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Code postal</Text>
                  <TextInput
                    style={styles.textInput}
                    value={ownerPostal}
                    onChangeText={setOwnerPostal}
                    placeholder="75001"
                    placeholderTextColor="#C7C7CC"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Caractéristiques</Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Nombre de pièces</Text>
              <TextInput
                style={styles.textInput}
                value={numberOfRooms}
                onChangeText={setNumberOfRooms}
                placeholder="3"
                placeholderTextColor="#C7C7CC"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Nb max invités</Text>
              <TextInput
                style={styles.textInput}
                value={maxGuests}
                onChangeText={setMaxGuests}
                placeholder="6"
                placeholderTextColor="#C7C7CC"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Prix par nuit (€)</Text>
            <TextInput
              style={styles.textInput}
              value={pricePerNight}
              onChangeText={setPricePerNight}
              placeholder="120"
              placeholderTextColor="#C7C7CC"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!name || !address || !city || 
             (!createNewOwner && !ownerId) ||
             (createNewOwner && (!ownerName || !ownerEmail || !ownerAddress || !ownerCity))
            ) && styles.createButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            !name || !address || !city || 
            (!createNewOwner && !ownerId) ||
            (createNewOwner && (!ownerName || !ownerEmail || !ownerAddress || !ownerCity)) ||
            isCreating
          }
        >
          <Text style={styles.createButtonText}>
            {isCreating ? "Création..." : "Créer"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const CreateReservationModal = ({
  visible,
  onClose,
  onCreateReservation,
}: {
  visible: boolean;
  onClose: () => void;
  onCreateReservation: (reservationData: any) => void;
}) => {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [cleaningFee, setCleaningFee] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    const reservationData = {
      guestName,
      guestEmail,
      guestPhone,
      guestCount: parseInt(guestCount),
      checkIn,
      checkOut,
      basePrice: parseFloat(basePrice),
      cleaningFee: cleaningFee ? parseFloat(cleaningFee) : undefined,
      notes,
    };
    onCreateReservation(reservationData);
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setGuestCount("1");
    setCheckIn("");
    setCheckOut("");
    setBasePrice("");
    setCleaningFee("");
    setNotes("");
    onClose();
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Créer une Réservation</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informations invité</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom de l'invité *</Text>
            <TextInput
              style={styles.textInput}
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Pierre Martin"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.textInput}
              value={guestEmail}
              onChangeText={setGuestEmail}
              placeholder="pierre.martin@example.com"
              placeholderTextColor="#C7C7CC"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.textInput}
                value={guestPhone}
                onChangeText={setGuestPhone}
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor="#C7C7CC"
                keyboardType="phone-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Nb invités</Text>
              <TextInput
                style={styles.textInput}
                value={guestCount}
                onChangeText={setGuestCount}
                placeholder="2"
                placeholderTextColor="#C7C7CC"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Dates de séjour</Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Check-in *</Text>
              <TextInput
                style={styles.textInput}
                value={checkIn}
                onChangeText={setCheckIn}
                placeholder="2024-01-15"
                placeholderTextColor="#C7C7CC"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Check-out *</Text>
              <TextInput
                style={styles.textInput}
                value={checkOut}
                onChangeText={setCheckOut}
                placeholder="2024-01-20"
                placeholderTextColor="#C7C7CC"
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Tarification</Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Prix de base (€) *</Text>
              <TextInput
                style={styles.textInput}
                value={basePrice}
                onChangeText={setBasePrice}
                placeholder="120"
                placeholderTextColor="#C7C7CC"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Frais ménage (€)</Text>
              <TextInput
                style={styles.textInput}
                value={cleaningFee}
                onChangeText={setCleaningFee}
                placeholder="50"
                placeholderTextColor="#C7C7CC"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Notes</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes supplémentaires</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Informations complémentaires..."
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!guestName ||
              !guestEmail ||
              !checkIn ||
              !checkOut ||
              !basePrice) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            !guestName || !guestEmail || !checkIn || !checkOut || !basePrice
          }
        >
          <Text style={styles.createButtonText}>Créer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1C1C1E",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  poleTypesContainer: {
    gap: 12,
  },
  poleTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  poleTypeOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  poleTypeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  poleTypeText: {
    flex: 1,
    fontSize: 16,
    color: "#1C1C1E",
    fontWeight: "500",
  },
  poleTypeTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  permissionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  permissionLabel: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: "#34C759",
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ownerTypeSelector: {
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  ownerTypeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  ownerTypeOptionSelected: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownerTypeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
  },
  ownerTypeTextSelected: {
    color: "#1C1C1E",
    fontWeight: "600",
  },
  inputPlaceholder: {
    fontSize: 16,
    color: "#C7C7CC",
  },
  ownersList: {
    marginTop: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    overflow: "hidden",
  },
  ownerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  ownerItemSelected: {
    backgroundColor: "#F0F8FF",
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  ownerEmail: {
    fontSize: 14,
    color: "#8E8E93",
  },
});

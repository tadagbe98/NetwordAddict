# NetSim Pro - Simulateur Réseau Web Multi-Constructeurs (Huawei, Cisco, Omada)

**NetSim Pro** est une application web moderne (React + TypeScript + Vite + Tailwind CSS) conçue selon le cahier des charges de simulateur réseau pédagogique multi-constructeurs. Elle permet d'expérimenter la conception, le câblage, la configuration en ligne de commande (CLI VRP / IOS) et via des interfaces d'administration web réelles, sans aucune installation locale lourde.

---

## 🚀 Fonctionnalités Clés

### 1. Architecture Mono-Constructeur Homogène (Section 3.1)
- Choix de l'écosystème à la création du projet :
  - **Huawei** : Routeurs AR (AR651, AR2220), Commutateurs CloudEngine (S5735-L, S6720), Contrôleur WLAN AC6005, CLI VRP authentique (`system-view`, `sysname`, `vlan batch`, `display...`) et WebUI Easy-Web.
  - **Cisco** : Routeurs ISR (4321, 1941), Commutateurs Catalyst (2960, 3650), WLC 3504, CLI IOS/IOS-XE (`enable`, `conf t`, `switchport`, `show run...`) et WebUI IOS-XE.
  - **TP-Link Omada SDN** : Passerelles ER605/ER7206, Switchs managés PoE SG2008P/SG3428, Bornes Wi-Fi 6 EAP650, Contrôleur matériel OC200 et interface Omada Controller v5.9 complète.
  - **Équipements génériques** : PC Desktop avec bureau virtuel (CMD, navigateur web, configuration IP statique/DHCP, ping graphique), Serveur multifonction (DNS, DHCP, serveur Web HTTP), Cloud/Passerelle WAN.

### 2. Canvas & Câblage Réaliste (Sections 3.3 & 3.4)
- Canvas interactif avec zoom fluide, déplacement panoramique, grille de magnétisme et mini-carte.
- Barre latérale d'équipements filtrée strictement par constructeur avec recherche instantanée.
- Gestion des câbles :
  - Cuivre RJ45 : Droit (Straight), Croisé (Crossover), Cat 5 (100 Mbps), Cat 6 (1 Gbps), Cat 6A (10 Gbps), S/FTP blindé.
  - Fibre optique & SFP : Jarretière LC-LC, liaisons directes DAC / Twinax 10G.
  - Câbles de gestion : Console Rollover, liaisons séries WAN synchrone V.35.
- Validation des connexions (contrôle de compatibilité des ports, alertes pédagogiques en cas de mauvaise connectique ou portée > 100m).
- Indicateurs LED de ports (vert = UP, éteint = DOWN, rouge/orange = anomalie).
- Environnements de pose : Intérieur (Indoor) vs Extérieur (Outdoor avec gaine résistante UV).

### 3. Terminal CLI Réaliste (Section 3.5)
- Fenêtre de terminal multi-onglets (gestion simultanée de plusieurs sessions d'équipements).
- Auto-complétion par touche `[Tab]`, aide contextuelle `?`, historique des commandes (touches Flèche Haut / Bas).
- Prompt dynamique reflétant le nom d'hôte et la hiérarchie des modes :
  - Huawei : `<Huawei>`, `[Huawei]`, `[Huawei-GE0/0/1]`, `[Huawei-vlan10]`
  - Cisco : `Router>`, `Router#`, `Router(config)#`, `Router(config-if)#`
  - Omada : `Omada-Switch#`
  - PC : `C:\Users\User>` (ipconfig, ping, tracert, arp -a)
- **Synchronisation bidirectionnelle CLI ↔ WebUI** : Toute modification appliquée en CLI met à jour le modèle commun, et vice-versa !

### 4. Interfaces d'Administration Web Simulées (Section 3.6)
- **Huawei Easy-Web** : Visualisation de la façade physique avec LEDs de ports, tableau de bord CPU/RAM, gestionnaire d'interfaces, table des VLANs, routage statique, serveur DHCP et bouton de sauvegarde dans la configuration de démarrage (`saved-configuration`).
- **Cisco IOS-XE WebUI** : Dashboard moderne, matrice des ports, configuration d'interfaces, création de VLANs 802.1Q, routes IP statiques.
- **TP-Link Omada SDN Controller** : Gestion centralisée multi-sites, adoption en un clic des commutateurs et points d'accès, créateur de réseaux Wi-Fi multi-SSID (avec isolation de VLANs), gestion du budget de puissance PoE.

### 5. Moteur de Simulation Réseau & Inspecteur de Trames (Section 3.7)
- Simulation Couche 1 (Physique), Couche 2 (Commutation, apprentissage MAC, filtrage et tagging VLAN 802.1Q access/trunk), Couche 3 (Adressage IPv4, routage de sous-réseaux, tables de routage, requêtes et réponses ICMP Ping), Couche 7 (DHCP, DNS, HTTP).
- Modes : **Temps réel** (circulation continue) et **Pas à pas** (inspection saut par saut).
- Animation visuelle des paquets circulant le long des câbles.
- **Inspecteur de Trame Réseau (Wireshark-Light)** : Décodage en-tête par en-tête (Ethernet II, IPv4, ICMP/UDP/TCP), journal des décisions matérielles prises par chaque équipement.
- Journal des événements temps réel filtrable.

### 6. Ateliers Guidés & Vérification Automatique (Section 3.9)
- Laboratoires intégrés par constructeur :
  - **Huawei HCIA** : Création et segmentation de VLANs sur Switch Huawei S5735.
  - **Cisco CCNA** : Routage inter-VLAN & Adressage IP sur Cisco ISR 4321.
  - **TP-Link Omada SDN** : Déploiement campus Wi-Fi & adoption centralisée d'équipements.
- Objectifs pas à pas, indices affichables, bouton « Vérifier la configuration » avec évaluation en temps réel de l'état réseau et confettis de célébration.

### 7. Internationalisation & Sauvegarde (Sections 3.3 & 3.10)
- Bilingue dès la v1 : Commutateur **FR / EN** dans l'en-tête.
- Sauvegarde et restauration complètes : Export / Import de la topologie en JSON.
- Export des configurations complètes de tous les équipements en fichier texte.

---

## 📁 Structure du Code dans `src/`

```
src/
├── types/
│   ├── network.ts           # Types réseau : Devices, Ports, Cables, Packets, VLANs, Routes, MAC
│   ├── cli.ts               # Types terminal, sessions et modes
│   ├── lab.ts               # Spécifications des ateliers guidés et objectifs
│   └── translations.ts      # Schéma i18n FR/EN
├── constants/
│   ├── catalog.ts           # Catalogue matériel (Huawei, Cisco, Omada, Générique)
│   ├── cables.ts            # Caractéristiques câbles, normes et validation
│   ├── defaultLabs.ts       # Laboratoires guidés avec validation automatique
│   └── translations.ts      # Dictionnaires FR et EN
├── context/
│   ├── NetworkContext.tsx   # État global, topologie, actions, simulation, persistence
│   └── I18nContext.tsx      # Contexte de langue (FR/EN)
├── engine/
│   ├── simulationEngine.ts  # Moteur d'événements discrets et file de paquets
│   ├── layer1Physical.ts    # Calcul physique des liens, duplex, vitesse, PoE
│   ├── layer2Switching.ts   # Commutation L2, apprentissage MAC, VLANs access/trunk
│   ├── layer3Routing.ts     # Routage L3, lookup table de routage, ICMP Echo/Reply
│   └── services.ts          # Services DHCP, DNS, HTTP
├── cli/
│   ├── cliParser.ts         # Tokenizer, prompts et aide contextuelle
│   ├── huaweiDriver.ts      # Driver VRP (system-view, vlan batch, display...)
│   ├── ciscoDriver.ts       # Driver IOS (enable, conf t, switchport, show...)
│   ├── omadaDriver.ts       # Driver Omada CLI
│   └── pcDriver.ts          # Invite de commande Windows CMD virtuelle (ipconfig, ping...)
├── components/
│   ├── header/
│   │   ├── TopNav.tsx             # Barre supérieure, modes, simulation, export/import
│   │   └── ProjectVendorModal.tsx # Sélecteur d'écosystème mono-constructeur
│   ├── sidebar/
│   │   ├── DevicePalette.tsx      # Palette d'équipements classés par catégorie
│   │   └── CableSelector.tsx      # Sélecteur de câble, environnement, longueur
│   ├── canvas/
│   │   ├── NetworkCanvas.tsx      # Canvas interactif avec pan/zoom et grille
│   │   ├── DeviceNode.tsx         # Noeud équipement (châssis, LEDs de ports, labels)
│   │   ├── CableLink.tsx          # Liaison câble avec état des ports et LEDs
│   │   ├── PacketCanvas.tsx       # Animation des paquets en vol le long des câbles
│   │   ├── MiniMap.tsx            # Mini-carte de navigation topologique
│   │   └── ContextMenu.tsx        # Menu contextuel (CLI, WebUI, Alimentation, Supprimer)
│   ├── terminal/
│   │   ├── XTermWrapper.tsx       # Émulateur terminal interactif
│   │   └── TerminalModal.tsx      # Fenêtre terminal multi-onglets
│   ├── webui/
│   │   ├── WebUIModal.tsx         # Conteneur d'interface web d'administration
│   │   ├── huawei/HuaweiWebUI.tsx # Interface Web Huawei Easy-Web (eSight)
│   │   ├── cisco/CiscoWebUI.tsx   # Interface Web Cisco IOS-XE
│   │   └── omada/OmadaControllerUI.tsx # Contrôleur TP-Link Omada SDN v5.9
│   ├── enddevice/
│   │   ├── PcDesktopModal.tsx     # Bureau PC virtuel (CMD, IP, Navigateur, Ping)
│   │   └── ServerConfigModal.tsx  # Configuration serveur (HTTP, DNS, DHCP)
│   ├── packetengine/
│   │   ├── PacketInspectorModal.tsx # Inspecteur de trames Wireshark-light
│   │   └── EventLogDrawer.tsx     # Tiroir de logs d'événements temps réel
│   └── labs/
│       └── GuidedLabsDrawer.tsx   # Tiroir des ateliers guidés avec vérification automatique
├── index.css
├── App.tsx
└── main.tsx
```

---

## 🛠️ Démarrage Rapide

1. **Installer les dépendances :**
   ```bash
   npm install
   ```

2. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```
   L'application s'ouvre sur `http://localhost:5173`.

3. **Compiler pour la production :**
   ```bash
   npm run build
   ```

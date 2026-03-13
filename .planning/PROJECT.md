# Milo Task Analysis Builder

## What This Is

Milo Task Analysis Builder e una web app per insegnanti, terapisti, educatori e famiglie che permette di creare, usare e condividere task analysis visuali per insegnare abilita passo-passo. Il prodotto si colloca a meta tra editor visuale, strumento operativo, libreria didattica e tracker leggero di esecuzione, con un'esperienza coerente con l'ecosistema Milo e con il linguaggio visivo di Symwriter.

## Core Value

Rendere semplice, prevedibile e riusabile l'insegnamento passo-passo delle abilita, trasformando attivita complesse in sequenze visive chiare che possano essere create dai professionisti e usate subito con il bambino.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] I professionisti possono creare task analysis visuali strutturate per abilita quotidiane, scolastiche e sociali.
- [ ] Ogni task analysis puo essere eseguita dentro l'app in una modalita presentazione guidata step-by-step, pulita e fullscreen.
- [ ] Le task analysis possono essere condivise tramite link pubblico per visualizzazione o uso interattivo senza richiedere account al destinatario.
- [ ] Le task analysis possono essere duplicate nel proprio spazio per favorire riuso e diffusione.
- [ ] L'app supporta supporti visivi multimodali per step, inclusi testo, simbolo e immagine/foto.
- [ ] Il prodotto supporta livelli di supporto differenti per costruire varianti progressive della stessa task analysis.
- [ ] L'app registra un tracking minimo di sessione per sapere quando, da chi e quante volte una task e stata completata.
- [ ] L'app permette export stampabile in PDF per l'uso nel contesto reale.
- [ ] L'autenticazione utente in v1 usa solo SSO con Milo.

### Out of Scope

- Tracking clinico avanzato per singolo step con aiuto usato, tempo e note - rinviato a V2 per non appesantire l'MVP.
- Collaborazione strutturata con workspace, ruoli e librerie di team - rinviata a V2 dopo validazione dell'uso individuale e della condivisione via link.
- Assegnazione task a bambini/classi con progressi dedicati - rinviata a V3 perche richiede un modello prodotto piu ampio.
- Riutilizzo in v1 di bambini, classi e utenti globali di Milo Writer/Symwriter - in v1 si integra solo il login SSO.
- Varianti automatiche AI, analytics avanzati, marketplace template e integrazione con PEI/obiettivi - future evoluzioni successive all'MVP.

## Context

Il prodotto nasce per risolvere un problema operativo concreto nel lavoro con bambini autistici, con disabilita cognitive o con bisogni educativi speciali: la necessita di scomporre attivita complesse in sequenze comprensibili, riusabili e condivisibili. Oggi questo lavoro viene spesso gestito in modo artigianale con fogli stampati, immagini prese online, PowerPoint, Word, Boardmaker e materiali non standardizzati, con forte perdita di tempo, scarsa coerenza tra operatori e nessuna vera tracciabilita.

L'app deve servire soprattutto terapisti ABA, logopedisti, TNPEE, educatori, insegnanti di sostegno e insegnanti della primaria o infanzia con bambini BES. Come target secondario puo servire genitori, piccoli centri educativi, cooperative e scuole che vogliono standardizzare materiali e procedure. Il prodotto deve quindi essere semplice nell'uso quotidiano ma abbastanza robusto e professionale da sostenere un modello in abbonamento.

La struttura ideale del prodotto comprende:
- una dashboard iniziale con task recenti, template pronti, bozze, categorie, task piu usate e segnali operativi;
- una libreria centrale di task analysis filtrabile per categoria, destinatario, contesto, autore, stato e livello di supporto;
- un editor task analysis semplice ma potente con header della task, lista step ordinata, azioni di riordino/duplicazione e gestione supporti;
- una present mode estremamente pulita per l'uso diretto con il bambino su tablet, telefono o PC.

Il cuore differenziante del prodotto e il concetto di livello di supporto. La stessa task analysis deve poter esistere in varianti progressive, ad esempio da supporto totale fino ad autonomia, usando combinazioni diverse di foto reali, simboli, testo, audio, numero di step mostrati e prompt.

V1 e definita come MVP operativo:
- autenticazione;
- creazione task analysis;
- editor step-by-step;
- immagini, simboli e testo;
- drag and drop;
- template base;
- modalita presentazione;
- tracking semplice di sessione;
- export PDF;
- condivisione link.

Milo e la piattaforma principale dell'ecosistema: questa app deve essere concepita come applicazione figlia collegata a Milo. In v1 riusa solo l'SSO di Milo; in v2 dovra poter convergere verso entita globali condivise tra piu app dell'ecosistema, incluse utenti, bambini e classi provenienti da Milo Writer/Symwriter.

La grafica deve essere coerente con Symwriter e Milo. In particolare va mantenuta una design language compatibile con il loro frontend: interfacce chiare e rassicuranti, superfici morbide, card pulite, gradienti controllati, bottoni primari evidenti, attenzione a viste full-screen ben curate e nessuna sensazione da strumento tecnico freddo.

## Constraints

- **Backend**: Java con REST API - coerenza con lo stack gia usato nell'ecosistema Milo e deploy previsto su Render.
- **Frontend**: Angular - coerenza con le altre web app Milo e deploy previsto su Vercel.
- **Database**: Supabase/Postgres - il prodotto usa uno schema dedicato distinto dallo schema `milo`.
- **Auth**: SSO con Milo in v1 - l'app deve integrarsi con l'identita centralizzata senza introdurre un sistema auth separato.
- **Ecosystem alignment**: compatibilita con Milo e Symwriter - architettura, UX e crescita futura devono restare allineate all'ecosistema principale.
- **MVP scope**: evitare complessita prematura - tracking clinico avanzato, ruoli, workspace e assegnazioni sono esclusi dalla prima versione.
- **UX**: esperienza rassicurante e operativa - l'app deve risultare usabile nel lavoro reale con bambini, non solo come editor di materiali.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stack backend Java REST deployato su Render | Allineamento con il resto dell'ecosistema Milo e preferenza tecnologica gia definita | - Pending |
| Frontend Angular deployato su Vercel | Coerenza con le altre app Milo e con il modo attuale di svilupparle/deployarle | - Pending |
| Database su Supabase con schema dedicato separato da `milo` | Separare i dati applicativi della nuova app mantenendo l'integrazione con l'ecosistema condiviso | - Pending |
| V1 usa solo SSO con Milo | Riduce complessita iniziale e accelera il time-to-market mantenendo continuita utente nell'ecosistema | - Pending |
| Present mode step-by-step inclusa in V1 | Trasforma il prodotto da semplice editor a strumento operativo reale | - Pending |
| Tracking V1 limitato alla sessione completata | Offre visibilita d'uso senza introdurre subito un modello clinico troppo complesso | - Pending |
| Condivisione V1 tramite link pubblico + duplicazione | Massimizza utilita immediata e viralita senza costruire subito collaboration avanzata | - Pending |
| Coerenza visiva con Symwriter/Milo | L'app deve apparire parte dello stesso ecosistema e non un prodotto isolato | - Pending |

---
*Last updated: 2026-03-13 after initialization*

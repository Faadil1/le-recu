import type { Cat, Cost } from "./receipt"

export type Locale = "fr" | "en"
export type UiKey = keyof typeof ui.fr
export const CATEGORY: Record<Locale, Record<Cat,string>> = {
  fr: { temps:"TEMPS", lien:"LIEN", image:"IMAGE", corps:"CORPS", retour:"RETOUR" },
  en: { temps:"TIME", lien:"PEOPLE", image:"REPUTATION", corps:"BODY", retour:"WAY BACK" },
}

// Canonical storage and selection use original French IDs. Languages affect presentation ONLY.
const DESIRES: Record<string,string> = {
  "dire non":"say no", "partir":"leave", "avouer":"confess", "rester":"stay",
  "poster ça":"post it", "rompre":"break up", "lui écrire":"text them", "quitter":"quit my job",
}

const COST_EN: Record<string,readonly [string,string]> = {
  dimanches:["your Sundays","They stop belonging to you."],
  mois:["eighteen months","Before it feels like a decision, not an escape."],
  soirs:["evenings after 10","The real schedule. By day, you pretend."],
  flou:["six uncertain weeks","You won't be able to explain what you're doing."],
  an:["one more year","Staying costs something too. It never shows on a receipt."],
  weekend:["the weekend you promised","The one you'd already given someone."],
  essai:["the unpaid trial","Nobody pays you to learn."],
  apres:["the Sunday after","It comes. This time, there are not two of you."],
  calendrier:["twenty years","Not a sprint. A whole calendar."],
  cible:["the following week","The thing stays. The wanting has already changed."],
  ami:["a friend who knew","They stop asking. No scene."],
  personne:["that person","'Like nothing happened' won't survive."],
  mere:["your mother calling","Three extra rings. Every time."],
  vendredi:["Friday's group","Your place closes up. Nobody takes a vote."],
  compte:["someone who counted on you","They'll have to find another yes."],
  enfant:["the child","You're deciding for someone who can't speak yet."],
  discussion:["the conversation","It doesn't end. It moves to another room."],
  temoin:["a witness","Someone will know you chose this."],
  dira:["what people will say","Not a lie. A version you didn't write."],
  cv:["the gap on your résumé","A blank you have to explain as a choice."],
  stable:["looking settled","You lose that before you know what comes next."],
  plaindre:["the right to complain","Once you've done it, the complaint is gone."],
  excuse:["the easy excuse","It won't hold up anymore. You know it."],
  recit:["control of the story","Someone else will tell it in your place."],
  feed:["the feed","You show the version. Never the bill."],
  demande:["the request","It can die without anyone saying no."],
  envoi:["the message you sent","You can't pretend you never wrote it."],
  objet:["the object","It will be yours. The cost stays."],
  epaules:["your shoulders","They carry this longer than your mind does."],
  sommeil:["three weeks of sleep","Your body gives in before you do."],
  appetit:["your appetite","Gone. Especially on Tuesdays."],
  matin:["your mornings","A knot before you've even had coffee."],
  nuit:["a sleepless night","Not pretty. Necessary."],
  verre:["the evening drink","It no longer counts as a reward."],
  ventre:["your stomach","It lands there before you can say it."],
  corps:["the borrowed body","September won't give it back."],
  doute:["comfortable uncertainty","Choosing kills the other option."],
  planb:["plan B","Naming it is burning it."],
  semblant:["pretending","You won't be able to turn it back on."],
  porte:["the door you came through","It closes without a sound."],
  retour:["the way back","Not forbidden. Just more expensive than leaving."],
  arriere:["the reverse gear","In theory, yes. In practice, no."],
  ambigu:["the ambiguity","It kept you safe. Now you're handing it back."],
  ticket:["the receipt","You return the item. Not the reason."],
  sens:["the one-way street","Not a door that opens again."],
}

export function localizedCost(cost:Cost, locale:Locale):Cost {
  if (locale==="fr") return cost
  const translation=COST_EN[cost.id]
  return translation?{...cost,label:translation[0],detail:translation[1]}:cost
}
export function missingEnglishCostIds(costs:readonly Cost[]):string[] {
  return costs.filter(c=>!COST_EN[c.id]).map(c=>c.id)
}
export function localizedDesire(value:string,locale:Locale):string {
  return locale==="en"?DESIRES[value]??value:value
}
export function getEnglishDesireMap():Readonly<Record<string,string>> {return DESIRES}
export function parseLocale(value:unknown):Locale|null {return value==="fr"||value==="en"?value:null}

export const ui = {
  fr:{
    pending:"DÉFI EN ATTENTE · 72 h pour répondre",
    closed:"Ce défi a déjà reçu une réponse depuis un autre navigateur.",
    expired:"Ce défi a expiré. Imprime un nouveau reçu.",
    missing:"Ce défi n'existe pas.",
    storage:"Ce navigateur ne peut pas enregistrer ta participation.",
    unavailable:"Défi indisponible.",
    title:"LE REÇU",
    loading:"LE PAPIER SE PRÉPARE…",
    revealed:"Deux décisions indépendantes. Un seul papier.",
    hidden:"Quelqu'un a déjà refusé un coût. Choisis sans voir lequel.",
    owner:"Ton choix est enregistré. L'autre personne ne le verra qu'après avoir décidé.",
    decided:"Ton choix est fait. Le défi reste à envoyer.",
    intro:"Cinq coûts. Tu en refuses un. Ensuite tu défies.",
    kickerSame:"MÊME REFUS",
    kickerDifferent:"PAS LA MÊME LIGNE",
    kickerBlind:"DÉFI À L'AVEUGLE",
    kickerReady:"ENVOIE-LE",
    kickerToday:"AUJOURD'HUI",
    refuse:"Refuser de payer",
    twoMarked:"TOI · EUX",
    no:"NON",
    other:"EUX",
    sealedOther:"Leur ligne est scellée. Barre la tienne.",
    stamp:"DÛ",
    refused:"Refusé",
    empty:"LA SALLE EST VIDE",
    room:"LA SALLE",
    tie:(n:number)=>`${n} refus. Aucune ligne ne mène.`,
    of:(n:number,total:number)=>`${n} sur ${total}`,
    signoff:"PAS UN CONSEIL · UN PRIX",
    sealing:"Scellement…",
    sharing:"Partage en cours…",
    seal:"Sceller mon choix",
    send:"Envoyer le défi",
    checking:"Vérification…",
    check:"Vérifier la réponse",
    stillPending:"Toujours en attente de l’autre personne. Ton défi reste actif pendant 72 h après sa création.",
    composing:"Composition…",
    poster:"Partager l'image du duo",
    copyText:"Copier la confrontation en texte",
    again:"À mon tour",
    challengeAgain:"Défier à mon tour",
    copyUrl:"Copier le lien uniquement",
    copyDuel:"Copier le duel",
    copied:"Copié dans le presse-papiers.",
    more:"UNE AUTRE ENVIE",
    mine:"la mienne",
    yourWish:"Ton envie",
    personal:"Les envies personnelles restent ici. Pour défier quelqu'un, choisis une des huit envies publiques.",
    placeholder:"partir, écrire, dire non…",
    print:"Imprimer",
    receipts:"TES REÇUS",
    history:"refusé",
    duelTitle:"DEUX SIGNATURES · UN REÇU",
    me:"01 / MOI",
    them:"02 / L'AUTRE",
    first:"01 / PREMIER REFUS",
    second:"02 / SECOND REFUS",
    nextStep:"PROCHAINE ÉTAPE",
    same:"MÊME REFUS",
    different:"PAS LA MÊME LIGNE",
    sameNote:"Vous avez refusé de payer le même prix.",
    diffNote:"Vous vouliez la même chose. Pas au même prix.",
    twoLimits:"MÊME ENVIE / DEUX LIMITES",
    posterQuestion:"ET TOI, TU BARRES QUOI ?",
    invitation:"Même envie. Deux limites.",
    errorCreate:"Le défi n'a pas pu être créé.",
    errorCheck:"Impossible de vérifier le défi.",
    errorReply:"Impossible de répondre au défi.",
    errorExport:"Le reçu n'a pas pu être exporté.",
    errorReceipt:"Le reçu attend encore une deuxième décision.",
    errorShare:"Ton navigateur ne permet pas ce partage.",
  },
  en:{
    pending:"WAITING FOR A REPLY · 72h to answer",
    closed:"This challenge has already been answered from another browser.",
    expired:"This challenge has expired. Print a new receipt.",
    missing:"This challenge doesn't exist.",
    storage:"This browser can't save your participation.",
    unavailable:"Challenge unavailable.",
    title:"THE RECEIPT",
    loading:"YOUR RECEIPT IS PRINTING…",
    revealed:"Two independent decisions. One receipt.",
    hidden:"Someone has refused one cost. Choose before you see theirs.",
    owner:"Your choice is saved. They won't see it until they've chosen.",
    decided:"Your choice is made. Now send the challenge.",
    intro:"Five costs. Refuse one. Then challenge someone.",
    kickerSame:"SAME REFUSAL",
    kickerDifferent:"NOT THE SAME LINE",
    kickerBlind:"BLIND CHALLENGE",
    kickerReady:"SEND IT",
    kickerToday:"TODAY",
    refuse:"Refuse to pay",
    twoMarked:"YOU · THEM",
    no:"NO",
    other:"THEM",
    sealedOther:"Their line is sealed. Cross out yours.",
    stamp:"DUE",
    refused:"Refused",
    empty:"NO RESPONSES YET",
    room:"THE ROOM",
    tie:(n:number)=>`${n} refusals. No clear winner.`,
    of:(n:number,total:number)=>`${n} of ${total}`,
    signoff:"NOT ADVICE · A PRICE",
    sealing:"Sealing…",
    sharing:"Sharing…",
    seal:"Seal my choice",
    send:"Send the challenge",
    checking:"Checking…",
    check:"Check for a reply",
    stillPending:"Still waiting for the other person. Your challenge is active for 72 hours after creation.",
    composing:"Composing…",
    poster:"Share the duo image",
    copyText:"Copy the comparison",
    again:"My turn",
    challengeAgain:"Challenge someone next",
    copyUrl:"Copy link only",
    copyDuel:"Copy the result",
    copied:"Copied to clipboard.",
    more:"ANOTHER WISH",
    mine:"my own",
    yourWish:"Your wish",
    personal:"Personal wishes stay here. To challenge someone, choose one of the eight public prompts.",
    placeholder:"leave, write, say no…",
    print:"Print",
    receipts:"YOUR RECEIPTS",
    history:"refused",
    duelTitle:"TWO SIGNATURES · ONE RECEIPT",
    me:"01 / ME",
    them:"02 / THE OTHER",
    first:"01 / FIRST CHOICE",
    second:"02 / SECOND CHOICE",
    nextStep:"NEXT STEP",
    same:"SAME REFUSAL",
    different:"NOT THE SAME LINE",
    sameNote:"You both refused to pay the same price.",
    diffNote:"You wanted the same thing. Not at the same price.",
    twoLimits:"SAME WISH / TWO LIMITS",
    posterQuestion:"WHAT WOULD YOU CROSS OUT?",
    invitation:"Same wish. Two limits.",
    errorCreate:"Couldn't create the challenge.",
    errorCheck:"Couldn't check the challenge.",
    errorReply:"Couldn't answer the challenge.",
    errorExport:"Couldn't export the receipt.",
    errorReceipt:"This receipt still needs a second decision.",
    errorShare:"Sharing isn't available in this browser.",
  },
} as const
export function t(locale:Locale):typeof ui.fr|typeof ui.en {return ui[locale]}
export function challengeCopy(desire:string,locale:Locale):string {
  return locale==="fr"
    ?`LE REÇU\n« ${localizedDesire(desire,locale)} »\n\nCinq coûts. J'en ai refusé un.\nChoisis sans voir ma ligne.\n\nEt toi, tu barres quoi ?`
    :`THE RECEIPT\n“${localizedDesire(desire,locale)}”\n\nFive costs. I refused one.\nChoose without seeing mine.\n\nWhat would you cross out?`
}
export function duelCopy(desire:string,theirs:string,mine:string,locale:Locale):string {
  const name=localizedDesire(desire,locale)
  const same=theirs===mine
  return locale==="fr"
    ?`LE REÇU\n« ${name} »\n\neux — ${theirs}\ntoi — ${mine}\n\n${same?"même refus.":"pas la même ligne."}\nEt toi, tu barres quoi ?`
    :`THE RECEIPT\n“${name}”\n\nthem — ${theirs}\nyou — ${mine}\n\n${same?"same refusal.":"not the same line."}\nWhat would you cross out?`
}
export function localizedServerError(message:string,locale:Locale):string {
  if(locale==="fr")return message
  const map:Record<string,string>={
    "Défi introuvable.":"Challenge not found.",
    "Ce défi a expiré.":"This challenge has expired.",
    "Ce défi a déjà reçu une réponse.":"This challenge has already been answered.",
    "Ouvre le défi dans un autre navigateur pour jouer à deux.":"Open this challenge in another browser to play with two people.",
    "Le reçu du jour a changé. Réimprime ce reçu avant de défier.":"Today's receipt has changed. Print a new one before inviting someone.",
    "Les duels sont disponibles sur les huit envies du jeu uniquement.":"Duels are available for the eight public wishes only.",
    "Duel indisponible : base de données persistante non configurée.":"Challenge unavailable: persistent database isn't configured.",
    "La participation requiert un navigateur qui conserve les données locales.":"You need a browser that allows local storage to participate.",
  }
  return map[message]??ui.en.unavailable
}

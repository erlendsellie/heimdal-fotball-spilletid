import { create } from 'zustand';
import { persist } from 'zustand/middleware';
type Language = 'nb' | 'en';
interface TranslationState {
  language: Language;
  setLanguage: (lang: Language) => void;
}
const useLanguageStore = create<TranslationState>()(
  persist(
    (set) => ({
      language: 'nb',
      setLanguage: (lang) => {
        set({ language: lang });
        document.documentElement.lang = lang;
      },
    }),
    {
      name: 'heimdal-language-storage',
    }
  )
);
const translations = {
  nb: {
    nav: {
      dashboard: 'Oversikt',
      tournaments: 'Turneringer',
      team: 'Lag',
      settings: 'Innstillinger',
      logout: 'Logg ut',
      title: 'Meny'
    },
    home: {
      heroTitle: 'Heimdal Fotball',
      subtitle: 'Spilletid & Bytte-verktøy',
      description: 'Kontroller og følg spilletid for hver spiller i sanntid. Fungerer offline, med smarte forslag til bytter.',
      upcomingMatches: 'Kommende Kamper',
      viewAll: 'Se alle',
      openMatch: 'Åpne Kamp',
    },
    login: {
      title: 'Trener Innlogging',
      description: 'Få tilgang til lagets kampoversikt.',
      email: 'E-post',
      password: 'Passord',
      submit: 'Logg Inn',
      loading: 'Logger inn...',
      success: 'Vellykket innlogget!',
      error: 'Innlogging feilet. Sjekk brukernavn og passord.',
    },
    match: {
      liveTitle: 'Live Kamp',
      opponent: 'mot',
      start: 'Start',
      pause: 'Pause',
      resume: 'Fortsett',
      stop: 'Stopp',
      substitute: 'Bytt',
      suggestionsTitle: 'Bytteforslag',
      reasonEven: 'Jevn spilletid',
      onField: 'På Banen',
      onBench: 'På Benken',
      substitutionMade: 'Bytte utført!',
      loading: 'Laster kamp...',
      noSuggestions: 'Ingen forslag tilgjengelig.',
    },
    tournament: {
      title: 'Turneringer',
      description: 'Administrer lagets turneringer og se samlet statistikk.',
      new: 'Ny Turnering',
      createTitle: 'Opprett Ny Turnering',
      name: 'Navn',
      carryover: 'Aktiver Kompensasjonsregler',
      create: 'Opprett',
      viewDetails: 'Vis Detaljer',
      created: 'Turnering opprettet! (Ikke implementert)',
    },
    team: {
      title: 'Lag & Spillere',
      description: 'Administrer lagets spillere.',
      addTitle: 'Legg Til Ny Spiller',
      searchPlaceholder: 'Søk spillere...',
      added: 'Spiller lagt til! (Ikke implementert)',
    },
    positions: {
      forward: 'Angriper',
      midfield: 'Midtbane',
      defense: 'Forsvar',
      goalkeeper: 'Keeper',
    },
    settings: {
      title: 'Innstillinger & Eksport',
      description: 'Tilpass appen og eksporter dataene dine.',
      general: 'Innstillinger',
      stats: 'Statistikk',
      exports: 'Eksport',
      autoSync: 'Automatisk Synkronisering',
      install: 'Installer App på Enhet',
      installInfo: 'Installasjonsdialog for PWA ville vist seg her.',
      exportCSV: 'Eksporter som CSV',
      exportJSON: 'Eksporter som JSON',
      exported: 'Data eksportert!',
      exporting: 'Eksporterer...',
      playerStats: 'Spillerstatistikk',
      playerStatsDesc: 'Totalt antall minutter spilt denne sesongen.',
      exportData: 'Eksporter Data',
      exportDataDesc: 'Last ned kamp- eller turneringsdata.',
    },
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      tournaments: 'Tournaments',
      team: 'Team',
      settings: 'Settings',
      logout: 'Logout',
      title: 'Menu'
    },
    home: {
      heroTitle: 'Heimdal Football',
      subtitle: 'Playtime & Substitution Tool',
      description: 'Control and track playing time for each player in real-time. Works offline, with smart substitution suggestions.',
      upcomingMatches: 'Upcoming Matches',
      viewAll: 'View all',
      openMatch: 'Open Match',
    },
    login: {
      title: 'Coach Login',
      description: "Access your team's match dashboard.",
      email: 'Email',
      password: 'Password',
      submit: 'Log In',
      loading: 'Logging in...',
      success: 'Successfully logged in!',
      error: 'Login failed. Check username and password.',
    },
    match: {
      liveTitle: 'Live Match',
      opponent: 'vs.',
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      stop: 'Stop',
      substitute: 'Substitute',
      suggestionsTitle: 'Substitution Suggestions',
      reasonEven: 'Even playing time',
      onField: 'On Field',
      onBench: 'On Bench',
      substitutionMade: 'Substitution made!',
      loading: 'Loading match...',
      noSuggestions: 'No suggestions available.',
    },
    tournament: {
      title: 'Tournaments',
      description: "Manage your team's tournaments and view aggregate statistics.",
      new: 'New Tournament',
      createTitle: 'Create New Tournament',
      name: 'Name',
      carryover: 'Enable Carryover Rules',
      create: 'Create',
      viewDetails: 'View Details',
      created: 'Tournament created! (Not implemented)',
    },
    team: {
      title: 'Team & Players',
      description: 'Manage your team roster.',
      addTitle: 'Add New Player',
      searchPlaceholder: 'Search players...',
      added: 'Player added! (Not implemented)',
    },
    positions: {
      forward: 'Forward',
      midfield: 'Midfield',
      defense: 'Defense',
      goalkeeper: 'Goalkeeper',
    },
    settings: {
      title: 'Settings & Exports',
      description: 'Customize the app and export your data.',
      general: 'Settings',
      stats: 'Statistics',
      exports: 'Exports',
      autoSync: 'Automatic Synchronization',
      install: 'Install App on Device',
      installInfo: 'PWA installation prompt would appear here.',
      exportCSV: 'Export as CSV',
      exportJSON: 'Export as JSON',
      exported: 'Data exported!',
      exporting: 'Exporting...',
      playerStats: 'Player Statistics',
      playerStatsDesc: 'Total minutes played this season.',
      exportData: 'Export Data',
      exportDataDesc: 'Download match or tournament data.',
    },
  },
};
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const t = (key: string): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    return result;
  };
  return { t, setLanguage, language };
}
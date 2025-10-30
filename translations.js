// src/translations.js
export const translations = {
  en: {
    // Common
    welcome: 'Welcome',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    patient: 'Patient',
    doctor: 'Doctor',
    save: 'Save',
    cancel: 'Cancel',
    
    // Home
    home: 'Home',
    medicine: 'Medicine',
    chat: 'Chat',
    profile: 'Profile',
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    
    // Settings
    settings: 'Settings',
    darkMode: 'Dark Mode',
    language: 'Language',
    theme: 'Theme',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    
    // Messages
    paymentSuccessful: 'Payment Successful',
    orderPlaced: 'Order Placed',
    appointmentBooked: 'Appointment Booked',
  },
  af: {
    // Afrikaans
    welcome: 'Welkom',
    login: 'Teken aan',
    register: 'Registreer',
    email: 'E-pos',
    password: 'Wagwoord',
    confirmPassword: 'Bevestig Wagwoord',
    fullName: 'Volledige Naam',
    patient: 'Pasiënt',
    doctor: 'Dokter',
    save: 'Stoor',
    cancel: 'Kanselleer',
    
    home: 'Tuis',
    medicine: 'Medisyne',
    chat: 'Klets',
    profile: 'Profiel',
    dashboard: 'Dashboard',
    appointments: 'Afsprake',
    
    settings: 'Instellings',
    darkMode: 'Donker Modus',
    language: 'Taal',
    theme: 'Tema',
    lightTheme: 'Ligte Tema',
    darkTheme: 'Donker Tema',
    
    paymentSuccessful: 'Betaling Suksesvol',
    orderPlaced: 'Bestelling Geplaas',
    appointmentBooked: 'Afspraak Bespreek',
  },
  zu: {
    // Zulu
    welcome: 'Siyakwamukela',
    login: 'Ngena',
    register: 'Bhalisa',
    email: 'I-imeyili',
    password: 'Iphasiwedi',
    confirmPassword: 'Qinisekisa Iphasiwedi',
    fullName: 'Igama Eligcwele',
    patient: 'Isiguli',
    doctor: 'Udokotela',
    save: 'Gcina',
    cancel: 'Khansela',
    
    home: 'Ikhaya',
    medicine: 'Imithi',
    chat: 'Xoxa',
    profile: 'Iphrofayela',
    dashboard: 'Ideshibhodi',
    appointments: 'Ama-aphoyintimenti',
    
    settings: 'Izilungiselelo',
    darkMode: 'Imodi Emnyama',
    language: 'Ulimi',
    theme: 'Itimu',
    lightTheme: 'Itimu Ekhanyayo',
    darkTheme: 'Itimu Emnyama',
    
    paymentSuccessful: 'Inkokhelo Iphumelele',
    orderPlaced: 'I-oda Ibekiwe',
    appointmentBooked: 'Ukuhlangana Kubhukiwe',
  },
};

export const getTranslation = (language, key) => {
  return translations[language]?.[key] || translations.en[key] || key;
};
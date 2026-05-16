import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

// Configuration Supabase
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://wxhcynlcjjdjptoxijhc.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || 'sb_publishable_CBfT-JEpCtklOhPgj6T1Zw_1wOr4a4k';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Textes multilingues
const translations = {
  fr: {
    appTitle: 'Premier Nuage',
    appSubtitle: 'Partager la vie de votre enfant en famille',
    createFamily: 'Créer un espace famille',
    joinFamily: 'Rejoindre un espace',
    childName: 'Prénom de l\'enfant',
    birthDate: 'Date de naissance',
    create: 'Créer',
    parentEmail: 'Email du parent',
    password: 'Mot de passe',
    startDate: 'Commencer',
    qrCode: 'Code QR',
    shareWith: 'Partager avec les proches',
    familyCode: 'Codes d\'accès',
    photos: 'Photos & vidéos',
    addPhoto: 'Ajouter une photo',
    caption: 'Légende (optionnelle)',
    upload: 'Télécharger',
    notifications: 'Notifications',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    pending: 'En attente d\'approbation',
    approved: 'Approuvé',
    milestone: 'Étape importante',
    birthday: 'Anniversaire',
    newPhoto: 'Nouvelle photo',
    welcomeMessage: 'Bienvenue sur Premier Nuage',
    scanQR: 'Scanner un code QR',
    enterCode: 'Ou entrez le code d\'accès',
    relativeEmail: 'Email du proche',
    approve: 'Approuver',
    deny: 'Refuser',
    today: 'Aujourd\'hui',
    days: 'jours',
  },
  en: {
    appTitle: 'Premier Nuage',
    appSubtitle: 'Share your child\'s life with family',
    createFamily: 'Create a family space',
    joinFamily: 'Join a space',
    childName: 'Child\'s name',
    birthDate: 'Birth date',
    create: 'Create',
    parentEmail: 'Parent email',
    password: 'Password',
    startDate: 'Start',
    qrCode: 'QR Code',
    shareWith: 'Share with relatives',
    familyCode: 'Access codes',
    photos: 'Photos & videos',
    addPhoto: 'Add a photo',
    caption: 'Caption (optional)',
    upload: 'Upload',
    notifications: 'Notifications',
    settings: 'Settings',
    logout: 'Logout',
    pending: 'Pending approval',
    approved: 'Approved',
    milestone: 'Milestone',
    birthday: 'Birthday',
    newPhoto: 'New photo',
    welcomeMessage: 'Welcome to Premier Nuage',
    scanQR: 'Scan a QR code',
    enterCode: 'Or enter the access code',
    relativeEmail: 'Relative email',
    approve: 'Approve',
    deny: 'Deny',
    today: 'Today',
    days: 'days',
  },
};

function App() {
  const [language, setLanguage] = useState('fr');
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [view, setView] = useState('auth'); // auth, create, join, family
  const [formData, setFormData] = useState({ childName: '', birthDate: '', email: '', password: '' });
  const [photos, setPhotos] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const t = translations[language];

  // Initialiser l'appli
  useEffect(() => {
    const savedUser = localStorage.getItem('premiernuage_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadFamily(userData.id);
    }
  }, []);

  // Charger la famille
  const loadFamily = async (parentId) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('parent_id', parentId)
        .single();
      
      if (data) {
        setFamily(data);
        setView('family');
        loadPhotos(data.id);
        loadFamilyMembers(data.id);
        loadNotifications(data.id);
      } else {
        setView('start');
      }
    } catch (err) {
      console.log('Pas de famille trouvée');
      setView('start');
    }
  };

  // Créer une famille
  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const qrCodeId = uuidv4();
      const { data, error } = await supabase
        .from('families')
        .insert([{
          parent_id: user.id,
          child_name: formData.childName,
          birth_date: formData.birthDate,
          qr_code_id: qrCodeId,
        }])
        .select()
        .single();

      if (error) throw error;

      setFamily(data);
      setFormData({ childName: '', birthDate: '' });
      setView('family');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // Créer un compte
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newUser = {
        id: uuidv4(),
        email: formData.email,
        password: formData.password, // En prod, utiliser un vrai système d'auth
      };
      
      localStorage.setItem('premiernuage_user', JSON.stringify(newUser));
      setUser(newUser);
      setFormData({ email: '', password: '', childName: '', birthDate: '' });
      setView('start');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // Charger les photos
  const loadPhotos = async (familyId) => {
    try {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('family_id', familyId)
        .order('uploaded_at', { ascending: false });
      
      setPhotos(data || []);
    } catch (err) {
      console.error('Erreur chargement photos:', err);
    }
  };

  // Charger les membres
  const loadFamilyMembers = async (familyId) => {
    try {
      const { data } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId);
      
      setFamilyMembers(data || []);
    } catch (err) {
      console.error('Erreur chargement membres:', err);
    }
  };

  // Charger les notifications
  const loadNotifications = async (familyId) => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setNotifications(data || []);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
    }
  };

  // Ajouter une photo
  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!family) return;

    setLoading(true);
    try {
      const caption = (e.target.caption?.value || '').trim();
      
      const { error } = await supabase
        .from('photos')
        .insert([{
          family_id: family.id,
          uploader_email: user.email,
          caption: caption || null,
          milestone: null,
        }]);

      if (error) throw error;

      e.target.reset();
      loadPhotos(family.id);
      
      // Créer une notification
      await supabase
        .from('notifications')
        .insert([{
          family_id: family.id,
          recipient_email: user.email,
          type: 'newPhoto',
          message: `${family.child_name} - ${caption || 'Nouvelle photo'}`,
        }]);

      loadNotifications(family.id);
    } catch (err) {
      alert('Erreur upload : ' + err.message);
    }
    setLoading(false);
  };

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem('premiernuage_user');
    setUser(null);
    setFamily(null);
    setView('auth');
  };

  // Vue d'authentification
  if (!user) {
    return (
      <div className="app">
        <div className="auth-container">
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
          
          <div className="language-switcher">
            <button onClick={() => setLanguage('fr')} className={language === 'fr' ? 'active' : ''}>FR</button>
            <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>EN</button>
          </div>

          <form onSubmit={handleSignUp}>
            <input
              type="email"
              placeholder={t.parentEmail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder={t.password}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Chargement...' : t.create}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Vue de sélection
  if (view === 'start') {
    return (
      <div className="app">
        <div className="start-container">
          <h1>{t.appTitle}</h1>
          <div className="language-switcher">
            <button onClick={() => setLanguage('fr')} className={language === 'fr' ? 'active' : ''}>FR</button>
            <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>EN</button>
          </div>
          
          <div className="button-group">
            <button className="btn-primary" onClick={() => setView('create')}>
              ➕ {t.createFamily}
            </button>
            <button className="btn-secondary" onClick={() => setView('join')}>
              📱 {t.joinFamily}
            </button>
          </div>
          
          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
        </div>
      </div>
    );
  }

  // Vue de création de famille
  if (view === 'create') {
    return (
      <div className="app">
        <div className="form-container">
          <h2>{t.createFamily}</h2>
          <form onSubmit={handleCreateFamily}>
            <input
              type="text"
              placeholder={t.childName}
              value={formData.childName}
              onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
              required
            />
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              required
            />
            <button type="submit" disabled={loading}>{t.create}</button>
            <button type="button" onClick={() => setView('start')}>← Retour</button>
          </form>
        </div>
      </div>
    );
  }

  // Vue de la famille
  if (view === 'family' && family) {
    const daysOld = Math.floor((new Date() - new Date(family.birth_date)) / (1000 * 60 * 60 * 24));

    return (
      <div className="app">
        <div className="family-container">
          <div className="header">
            <h1>{family.child_name}</h1>
            <p>{daysOld} {t.days}</p>
            <div className="language-switcher">
              <button onClick={() => setLanguage('fr')} className={language === 'fr' ? 'active' : ''}>FR</button>
              <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>EN</button>
            </div>
          </div>

          <div className="qr-section">
            <h3>{t.qrCode}</h3>
            <QRCode value={`${window.location.origin}?join=${family.qr_code_id}`} size={200} />
            <p className="qr-id">Code : {family.qr_code_id.substring(0, 8)}</p>
          </div>

          <div className="tabs">
            <button onClick={() => setView('photos')} className="tab-btn">📸 {t.photos}</button>
            <button onClick={() => setView('members')} className="tab-btn">👥 {t.shareWith}</button>
            <button onClick={() => setView('notifications')} className="tab-btn">🔔 {t.notifications}</button>
          </div>

          <button className="btn-logout" onClick={() => { setFamily(null); setView('start'); }}>← {t.createFamily}</button>
          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
        </div>
      </div>
    );
  }

  // Vue des photos
  if (view === 'photos' && family) {
    return (
      <div className="app">
        <div className="photos-container">
          <h2>📸 {t.photos}</h2>
          
          <form onSubmit={handleAddPhoto} className="photo-form">
            <input
              type="text"
              name="caption"
              placeholder={t.caption}
            />
            <input type="file" accept="image/*,video/*" required />
            <button type="submit" disabled={loading}>{t.upload}</button>
          </form>

          <div className="photos-list">
            {photos.map((photo) => (
              <div key={photo.id} className="photo-card">
                <p className="photo-caption">{photo.caption || 'Sans titre'}</p>
                <p className="photo-date">{new Date(photo.uploaded_at).toLocaleDateString()}</p>
              </div>
            ))}
            {photos.length === 0 && <p className="empty">{t.welcomeMessage}</p>}
          </div>

          <button onClick={() => setView('family')}>← Retour</button>
        </div>
      </div>
    );
  }

  // Vue des membres
  if (view === 'members' && family) {
    return (
      <div className="app">
        <div className="members-container">
          <h2>👥 {t.shareWith}</h2>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            // À implémenter : inviter un proche
          }} className="invite-form">
            <input
              type="email"
              placeholder={t.relativeEmail}
              required
            />
            <button type="submit">{t.create}</button>
          </form>

          <div className="members-list">
            {familyMembers.map((member) => (
              <div key={member.id} className="member-card">
                <p>{member.email}</p>
                <p className={`status ${member.status}`}>{member.status === 'pending' ? t.pending : t.approved}</p>
              </div>
            ))}
          </div>

          <button onClick={() => setView('family')}>← Retour</button>
        </div>
      </div>
    );
  }

  // Vue des notifications
  if (view === 'notifications' && family) {
    return (
      <div className="app">
        <div className="notifications-container">
          <h2>🔔 {t.notifications}</h2>
          
          <div className="notifications-list">
            {notifications.map((notif) => (
              <div key={notif.id} className="notification-card">
                <p>{notif.message}</p>
                <p className="notification-date">{new Date(notif.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {notifications.length === 0 && <p className="empty">Pas de notifications</p>}
          </div>

          <button onClick={() => setView('family')}>← Retour</button>
        </div>
      </div>
    );
  }

  return <div>Erreur d'affichage</div>;
}

export default App;

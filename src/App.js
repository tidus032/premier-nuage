/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import './App.css';

const SUPABASE_URL = 'https://wxhcynlcjjdjptoxijhc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CBfT-JEpCtklOhPgj6T1Zw_1wOr4a4k';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const translations = {
  fr: {
    appTitle: 'Premier Nuage',
    appSubtitle: 'Partager la vie de votre enfant en famille',
    createFamily: 'Créer un espace famille',
    childName: 'Prénom de l\'enfant',
    birthDate: 'Date de naissance',
    create: 'Créer',
    parentEmail: 'Email du parent',
    password: 'Mot de passe',
    qrCode: 'Code QR',
    photos: 'Photos & vidéos',
    addPhoto: 'Ajouter une photo',
    caption: 'Légende (optionnelle)',
    upload: 'Télécharger',
    logout: 'Déconnexion',
  },
  en: {
    appTitle: 'Premier Nuage',
    appSubtitle: 'Share your child\'s life with family',
    createFamily: 'Create a family space',
    childName: 'Child\'s name',
    birthDate: 'Birth date',
    create: 'Create',
    parentEmail: 'Parent email',
    password: 'Password',
    qrCode: 'QR Code',
    photos: 'Photos & videos',
    addPhoto: 'Add a photo',
    caption: 'Caption (optional)',
    upload: 'Upload',
    logout: 'Logout',
  },
};

function App() {
  const [language, setLanguage] = useState('fr');
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [view, setView] = useState('auth');
  const [formData, setFormData] = useState({ childName: '', birthDate: '', email: '', password: '' });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const savedUser = localStorage.getItem('premiernuage_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
    }
  }, []);

  const loadFamily = async (parentId) => {
    try {
      const { data } = await supabase
        .from('families')
        .select('*')
        .eq('parent_id', parentId)
        .single();
      
      if (data) {
        setFamily(data);
        setView('family');
        loadPhotos(data.id);
      } else {
        setView('start');
      }
    } catch {
      setView('start');
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const qrCodeId = Math.random().toString(36).substring(2, 15);
      const { data } = await supabase
        .from('families')
        .insert([{
          parent_id: user.id,
          child_name: formData.childName,
          birth_date: formData.birthDate,
          qr_code_id: qrCodeId,
        }])
        .select()
        .single();

      setFamily(data);
      setFormData({ childName: '', birthDate: '' });
      setView('family');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newUser = {
        id: Math.random().toString(36).substring(2, 15),
        email: formData.email,
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

  const loadPhotos = async (familyId) => {
    try {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('family_id', familyId)
        .order('uploaded_at', { ascending: false });
      
      setPhotos(data || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!family) return;

    setLoading(true);
    try {
      const caption = (e.target.caption?.value || '').trim();
      
      await supabase
        .from('photos')
        .insert([{
          family_id: family.id,
          uploader_email: user.email,
          caption: caption || null,
        }]);

      e.target.reset();
      loadPhotos(family.id);
    } catch (err) {
      alert('Erreur upload : ' + err.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('premiernuage_user');
    setUser(null);
    setFamily(null);
    setView('auth');
  };

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
          </div>
          
          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
        </div>
      </div>
    );
  }

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

  if (view === 'family' && family) {
    const daysOld = Math.floor((new Date() - new Date(family.birth_date)) / (1000 * 60 * 60 * 24));

    return (
      <div className="app">
        <div className="family-container">
          <div className="header">
            <h1>{family.child_name}</h1>
            <p>{daysOld} jours</p>
            <div className="language-switcher">
              <button onClick={() => setLanguage('fr')} className={language === 'fr' ? 'active' : ''}>FR</button>
              <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>EN</button>
            </div>
          </div>

          <div className="qr-section">
            <h3>{t.qrCode}</h3>
            <QRCode value={`${window.location.origin}?join=${family.qr_code_id}`} size={200} />
            <p className="qr-id">Code : {family.qr_code_id}</p>
          </div>

          <div className="tabs">
            <button onClick={() => setView('photos')} className="tab-btn">📸 {t.photos}</button>
          </div>

          <button className="btn-logout" onClick={() => { setFamily(null); setView('start'); }}>← Retour</button>
          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
        </div>
      </div>
    );
  }

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
            {photos.length === 0 && <p className="empty">Aucune photo pour le moment</p>}
          </div>

          <button onClick={() => setView('family')}>← Retour</button>
        </div>
      </div>
    );
  }

  return <div>Erreur</div>;
}

export default App;
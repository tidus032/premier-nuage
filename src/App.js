/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import './App.css';

const SUPABASE_URL = 'https://wxhcynlcjjdjptoxijhc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CBfT-JEpCtklOhPgj6T1Zw_1wOr4a4k';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const translations = {
  fr: {
    appTitle: 'Premier Nuage',
    appSubtitle: 'Partager la vie de votre enfant en famille',
    parentSpace: 'Espace Parents',
    relativeSpace: 'Espace Proches',
    email: 'Email',
    password: 'Mot de passe',
    login: 'Se connecter',
    signup: 'S\'inscrire',
    childName: 'Prénom de l\'enfant',
    birthDate: 'Date de naissance',
    create: 'Créer',
    logout: 'Déconnexion',
    qrCode: 'Code QR',
    photos: 'Photos & vidéos',
    addPhoto: 'Ajouter une photo',
    caption: 'Légende',
    upload: 'Télécharger',
    accessRequests: 'Demandes d\'accès',
    approve: 'Approuver',
    deny: 'Refuser',
    pending: 'En attente',
    approved: 'Approuvé',
    name: 'Prénom',
    children: 'Enfants',
  },
  en: {
    appTitle: 'Premier Nuage',
    appSubtitle: 'Share your child\'s life with family',
    parentSpace: 'Parents Space',
    relativeSpace: 'Relatives Space',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    signup: 'Sign up',
    childName: 'Child\'s name',
    birthDate: 'Birth date',
    create: 'Create',
    logout: 'Logout',
    qrCode: 'QR Code',
    photos: 'Photos & videos',
    addPhoto: 'Add photo',
    caption: 'Caption',
    upload: 'Upload',
    accessRequests: 'Access Requests',
    approve: 'Approve',
    deny: 'Deny',
    pending: 'Pending',
    approved: 'Approved',
    name: 'Name',
    children: 'Children',
  },
};

function App() {
  const [language, setLanguage] = useState('fr');
  const [userType, setUserType] = useState(null); // 'parent' ou 'relative'
  const [user, setUser] = useState(null);
  const [view, setView] = useState('auth');
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', childName: '', birthDate: '' });
  const [loading, setLoading] = useState(false);

  const t = translations[language];

  // Hash simple pour le password (en production, utiliser bcrypt)
  const hashPassword = (password) => {
    return btoa(password);
  };

  const verifyPassword = (password, hash) => {
    return btoa(password) === hash;
  };

  // ===== PARENT LOGIN =====
  const handleParentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email)
        .single();

      if (!data || !verifyPassword(formData.password, data.password_hash)) {
        alert('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      localStorage.setItem('premiernuage_parent', JSON.stringify(data));
      setUser(data);
      setUserType('parent');
      setView('parent-dashboard');
      loadParentChildren(data.id);
      setFormData({ email: '', password: '', name: '', childName: '', birthDate: '' });
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== PARENT SIGNUP =====
  const handleParentSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          email: formData.email,
          password_hash: hashPassword(formData.password),
        });

      if (error) throw error;

      alert('Compte créé ! Veuillez vous connecter.');
      setFormData({ email: '', password: '', name: '', childName: '', birthDate: '' });
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== RELATIVE LOGIN =====
  const handleRelativeLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await supabase
        .from('relatives')
        .select('*')
        .eq('email', formData.email)
        .single();

      if (!data || !verifyPassword(formData.password, data.password_hash)) {
        alert('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      localStorage.setItem('premiernuage_relative', JSON.stringify(data));
      setUser(data);
      setUserType('relative');
      setView('relative-children');
      setFormData({ email: '', password: '', name: '', childName: '', birthDate: '' });
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== RELATIVE SIGNUP VIA QR =====
  const handleRelativeSignupViaQR = async (qrCodeId) => {
    setLoading(true);
    try {
      // Vérifier que l'enfant existe
      const { data: childData } = await supabase
        .from('children')
        .select('*')
        .eq('qr_code_id', qrCodeId)
        .single();

      if (!childData) {
        alert('Code QR invalide');
        setLoading(false);
        return;
      }

      // Créer le compte du proche
      const { error: signupError } = await supabase
        .from('relatives')
        .insert({
          email: formData.email,
          name: formData.name,
          password_hash: hashPassword(formData.password),
        });

      if (signupError) throw signupError;

      // Créer la demande d'accès
      const { data: relativeData } = await supabase
        .from('relatives')
        .select('id')
        .eq('email', formData.email)
        .single();

      await supabase
        .from('access_requests')
        .insert({
          child_id: childData.id,
          relative_id: relativeData.id,
          status: 'pending',
        });

      alert('Demande d\'accès envoyée ! En attente de validation des parents.');
      setFormData({ email: '', password: '', name: '', childName: '', birthDate: '' });
      setView('auth');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== LOAD DATA =====
  const loadParentChildren = async (parentId) => {
    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId);
    setChildren(data || []);
  };

  const loadPhotos = async (childId) => {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('child_id', childId)
      .order('uploaded_at', { ascending: false });
    setPhotos(data || []);
  };

  const loadAccessRequests = async (childId) => {
    const { data } = await supabase
      .from('access_requests')
      .select('*')
      .eq('child_id', childId)
      .eq('status', 'pending');
    setAccessRequests(data || []);
  };

  // ===== PARENT CREATE CHILD =====
  const handleCreateChild = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const qrCodeId = Math.random().toString(36).substring(2, 15);
      const { error } = await supabase
        .from('children')
        .insert({
          parent_id: user.id,
          name: formData.childName,
          birth_date: formData.birthDate,
          qr_code_id: qrCodeId,
        });

      if (error) throw error;

      setFormData({ ...formData, childName: '', birthDate: '' });
      loadParentChildren(user.id);
      setView('parent-dashboard');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== ADD PHOTO =====
  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!selectedChild) return;

    setLoading(true);
    try {
      const caption = (e.target.caption?.value || '').trim();
      const { error } = await supabase
        .from('photos')
        .insert({
          child_id: selectedChild.id,
          uploaded_by: user.id,
          caption: caption || null,
        });

      if (error) throw error;

      e.target.reset();
      loadPhotos(selectedChild.id);
      alert('Photo ajoutée !');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== APPROVE/DENY ACCESS =====
  const handleApproveAccess = async (requestId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) throw error;

      loadAccessRequests(selectedChild.id);
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  const handleDenyAccess = async (requestId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('access_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      loadAccessRequests(selectedChild.id);
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== RELATIVE VIEW CHILDREN =====
  const loadRelativeChildren = async (relativeId) => {
    const { data } = await supabase
      .from('access_requests')
      .select('child_id, children(*)')
      .eq('relative_id', relativeId)
      .eq('status', 'approved');

    if (data) {
      setChildren(data.map(r => r.children));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('premiernuage_parent');
    localStorage.removeItem('premiernuage_relative');
    setUser(null);
    setUserType(null);
    setView('auth');
    setChildren([]);
    setSelectedChild(null);
  };

  // ===== RENDER AUTH =====
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

          {view === 'auth' && (
            <div className="auth-choices">
              <button className="btn-primary" onClick={() => setView('parent-login')}>👨‍👩‍👧 {t.parentSpace}</button>
              <button className="btn-secondary" onClick={() => setView('relative-join')}>👥 {t.relativeSpace}</button>
            </div>
          )}

          {view === 'parent-login' && (
            <div>
              <h2>{t.parentSpace}</h2>
              <form onSubmit={handleParentLogin}>
                <input type="email" placeholder={t.email} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder={t.password} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <button type="submit" disabled={loading}>{t.login}</button>
              </form>
              <p>Pas de compte ? <button onClick={() => setView('parent-signup')} style={{background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline'}}>{t.signup}</button></p>
              <button onClick={() => setView('auth')}>← Retour</button>
            </div>
          )}

          {view === 'parent-signup' && (
            <div>
              <h2>{t.parentSpace} - {t.signup}</h2>
              <form onSubmit={handleParentSignup}>
                <input type="email" placeholder={t.email} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder={t.password} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <button type="submit" disabled={loading}>{t.signup}</button>
              </form>
              <button onClick={() => setView('parent-login')}>← Retour</button>
            </div>
          )}

          {view === 'relative-join' && (
            <div>
              <h2>{t.relativeSpace}</h2>
              <p>Scannez le QR code ou entrez le code</p>
              <input type="text" placeholder="Code QR" id="qr-input" />
              <form onSubmit={(e) => {
                e.preventDefault();
                const qrCode = document.getElementById('qr-input').value;
                setFormData({...formData, qrCodeId: qrCode});
                setView('relative-signup');
              }}>
                <button type="submit">{t.create}</button>
              </form>
              <button onClick={() => setView('auth')}>← Retour</button>
            </div>
          )}

          {view === 'relative-signup' && (
            <div>
              <h2>{t.relativeSpace} - {t.signup}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleRelativeSignupViaQR(formData.qrCodeId);
              }}>
                <input type="text" placeholder={t.name} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <input type="email" placeholder={t.email} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder={t.password} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <button type="submit" disabled={loading}>{t.signup}</button>
              </form>
              <button onClick={() => setView('relative-join')}>← Retour</button>
            </div>
          )}

          {view === 'relative-login' && (
            <div>
              <h2>{t.relativeSpace}</h2>
              <form onSubmit={handleRelativeLogin}>
                <input type="email" placeholder={t.email} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder={t.password} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <button type="submit" disabled={loading}>{t.login}</button>
              </form>
              <button onClick={() => setView('auth')}>← Retour</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== PARENT DASHBOARD =====
  if (userType === 'parent' && view === 'parent-dashboard') {
    return (
      <div className="app">
        <div className="family-container">
          <h1>{t.parentSpace}</h1>
          <div className="language-switcher">
            <button onClick={() => setLanguage('fr')} className={language === 'fr' ? 'active' : ''}>FR</button>
            <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>EN</button>
          </div>

          <div className="children-list">
            <h2>{t.children}</h2>
            {children.map(child => (
              <div key={child.id} className="child-card" onClick={() => {
                setSelectedChild(child);
                loadPhotos(child.id);
                loadAccessRequests(child.id);
                setView('parent-child');
              }}>
                <h3>{child.name}</h3>
                <p>{new Date(child.birth_date).toLocaleDateString()}</p>
              </div>
            ))}
            <button className="btn-primary" onClick={() => setView('parent-create-child')}>➕ Ajouter un enfant</button>
          </div>

          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
        </div>
      </div>
    );
  }

  // ===== PARENT CREATE CHILD =====
  if (userType === 'parent' && view === 'parent-create-child') {
    return (
      <div className="app">
        <div className="form-container">
          <h2>Créer un espace pour votre enfant</h2>
          <form onSubmit={handleCreateChild}>
            <input type="text" placeholder={t.childName} value={formData.childName} onChange={(e) => setFormData({...formData, childName: e.target.value})} required />
            <input type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} required />
            <button type="submit" disabled={loading}>{t.create}</button>
          </form>
          <button onClick={() => setView('parent-dashboard')}>← Retour</button>
        </div>
      </div>
    );
  }

  // ===== PARENT CHILD VIEW =====
  if (userType === 'parent' && view === 'parent-child' && selectedChild) {
    const daysOld = Math.floor((new Date() - new Date(selectedChild.birth_date)) / (1000 * 60 * 60 * 24));

    return (
      <div className="app">
        <div className="family-container">
          <h1>{selectedChild.name}</h1>
          <p>{daysOld} jours</p>

          <div className="qr-section">
            <h3>{t.qrCode}</h3>
            <QRCode value={selectedChild.qr_code_id} size={200} />
            <p className="qr-id">{selectedChild.qr_code_id}</p>
          </div>

          <div className="tabs">
            <button onClick={() => setView('parent-photos')} className="tab-btn">📸 {t.photos}</button>
            <button onClick={() => setView('parent-access')} className="tab-btn">👥 {t.accessRequests}</button>
          </div>

          <button onClick={() => setView('parent-dashboard')}>← Retour</button>
          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
        </div>
      </div>
    );
  }

  // ===== PARENT PHOTOS =====
  if (userType === 'parent' && view === 'parent-photos' && selectedChild) {
    return (
      <div className="app">
        <div className="photos-container">
          <h2>📸 {t.photos}</h2>

          <form onSubmit={handleAddPhoto} className="photo-form">
            <input type="text" name="caption" placeholder={t.caption} />
            <button type="submit" disabled={loading}>{t.upload}</button>
          </form>

          <div className="photos-list">
            {photos.map(photo => (
              <div key={photo.id} className="photo-card">
                <p className="photo-caption">{photo.caption || 'Sans titre'}</p>
                <p className="photo-date">{new Date(photo.uploaded_at).toLocaleDateString()}</p>
              </div>
            ))}
            {photos.length === 0 && <p className="empty">Aucune photo pour le moment</p>}
          </div>

          <button onClick={() => setView('parent-child')}>← Retour</button>
        </div>
      </div>
    );
  }

  // ===== PARENT ACCESS REQUESTS =====
  if (userType === 'parent' && view === 'parent-access' && selectedChild) {
    return (
      <div className="app">
        <div className="access-container">
          <h2>👥 {t.accessRequests}</h2>

          <div className="requests-list">
            {accessRequests.map(request => (
              <div key={request.id} className="request-card">
                <p>{request.id}</p>
                <button onClick={() => handleApproveAccess(request.id)} className="btn-primary">{t.approve}</button>
                <button onClick={() => handleDenyAccess(request.id)} className="btn-logout">{t.deny}</button>
              </div>
            ))}
            {accessRequests.length === 0 && <p className="empty">Pas de demandes en attente</p>}
          </div>

          <button onClick={() => setView('parent-child')}>← Retour</button>
        </div>
      </div>
    );
  }

  // ===== RELATIVE CHILDREN =====
  if (userType === 'relative' && view === 'relative-children') {
    return (
      <div className="app">
        <div className="family-container">
          <h1>{t.relativeSpace}</h1>
          <div className="language-switcher">
            <button onClick={() => setLanguage('fr')} className={language === 'fr' ? 'active' : ''}>FR</button>
            <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>EN</button>
          </div>

          <div className="children-list">
            {children.map(child => (
              <div key={child.id} className="child-card" onClick={() => {
                setSelectedChild(child);
                loadPhotos(child.id);
                setView('relative-photos');
              }}>
                <h3>{child.name}</h3>
              </div>
            ))}
          </div>

          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
        </div>
      </div>
    );
  }

  // ===== RELATIVE PHOTOS =====
  if (userType === 'relative' && view === 'relative-photos' && selectedChild) {
    return (
      <div className="app">
        <div className="photos-container">
          <h2>📸 {selectedChild.name}</h2>

          <div className="photos-list">
            {photos.map(photo => (
              <div key={photo.id} className="photo-card">
                <p className="photo-caption">{photo.caption || 'Sans titre'}</p>
                <p className="photo-date">{new Date(photo.uploaded_at).toLocaleDateString()}</p>
              </div>
            ))}
            {photos.length === 0 && <p className="empty">Aucune photo pour le moment</p>}
          </div>

          <button onClick={() => setView('relative-children')}>← Retour</button>
        </div>
      </div>
    );
  }

  return <div>Erreur</div>;
}

export default App;
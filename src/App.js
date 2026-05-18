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

// Composant pour afficher les photos directement du bucket public
function PhotoDisplay({ filePath }) {
  const imageUrl = `https://wxhcynlcjjdjptoxijhc.supabase.co/storage/v1/object/public/photos/${filePath}`;
  
  return (
    <img 
      src={imageUrl} 
      alt="photo" 
      style={{width: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'cover'}} 
      onError={(e) => {
        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23eee" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3EPhoto non trouvée%3C/text%3E%3C/svg%3E';
      }}
    />
  );
}

// Galerie avec swipe
function PhotoGallery({ photos, onClose, userType, user, selectedChild }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    if (currentPhoto) {
      loadComments(currentPhoto.id);
    }
  }, [currentPhoto]);

  const loadComments = async (photoId) => {
    try {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('photo_id', photoId)
        .order('created_at', { ascending: true });
      setComments(data || []);
    } catch (err) {
      console.error('Erreur chargement commentaires:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoadingComment(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          photo_id: currentPhoto.id,
          relative_id: user.id,
          text: newComment,
        });

      if (error) throw error;

      setNewComment('');
      loadComments(currentPhoto.id);
    } catch (err) {
      console.error('Erreur ajout commentaire:', err);
      alert('Erreur : ' + err.message);
    }
    setLoadingComment(false);
  };

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
  };

  useEffect(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [touchStart, touchEnd, currentIndex, photos.length]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: '#1a1a1a',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{color: '#fff', fontSize: '14px'}}>
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      {/* Photo */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <img
          src={`https://wxhcynlcjjdjptoxijhc.supabase.co/storage/v1/object/public/photos/${currentPhoto.file_path}`}
          alt="fullscreen"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Infos + Commentaires */}
      <div style={{
        background: '#1a1a1a',
        color: '#fff',
        padding: '20px',
        maxHeight: '35%',
        overflowY: 'auto',
        borderTop: '1px solid #333'
      }}>
        <p style={{marginBottom: '10px', fontSize: '14px', color: '#999'}}>
          {currentPhoto.caption}
        </p>
        {currentPhoto.photo_date && (
          <p style={{marginBottom: '15px', fontSize: '12px', color: '#666'}}>
            {new Date(currentPhoto.photo_date).toLocaleDateString()}
          </p>
        )}

        {/* Commentaires (visible pour proches) */}
        {userType === 'relative' && (
          <div>
            <h4 style={{marginBottom: '10px', fontSize: '14px'}}>Commentaires</h4>
            <div style={{marginBottom: '15px', maxHeight: '150px', overflowY: 'auto'}}>
              {comments.map(comment => (
                <p key={comment.id} style={{fontSize: '12px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #333'}}>
                  <strong style={{color: '#ff6b9d'}}>{comment.relative_id.substring(0, 8)}</strong>: {comment.text}
                </p>
              ))}
            </div>

            <form onSubmit={handleAddComment} style={{display: 'flex', gap: '10px'}}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#2d2d2d',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <button
                type="submit"
                disabled={loadingComment || !newComment.trim()}
                style={{
                  padding: '8px 16px',
                  background: '#ff6b9d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✓
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const translations = {
  fr: {
    appTitle: 'Premier Nuage',
    email: 'Email',
    password: 'Mot de passe',
    newPassword: 'Nouveau mot de passe',
    login: 'Se connecter',
    signup: 'S\'inscrire',
    create: 'Créer',
    logout: 'Déconnexion',
    photos: 'Photos',
    accessRequests: 'Demandes d\'accès',
    approve: 'Approuver',
    deny: 'Refuser',
    name: 'Prénom',
    lastName: 'Nom de famille',
    bio: 'Bio',
    parent1: 'Parent 1',
    parent2: 'Parent 2',
    weight: 'Poids (g)',
    height: 'Taille (cm)',
    bloodType: 'Groupe sanguin',
    eyeColor: 'Couleur des yeux',
    hairColor: 'Couleur des cheveux',
    allergies: 'Allergies',
    profilePicture: 'Photo de profil (URL)',
    birthDate: 'Date de naissance',
    relationship: 'Lien de parenté',
    children: 'Enfants',
    edit: 'Modifier',
    save: 'Enregistrer',
    cancel: 'Annuler',
    accessManagement: 'Gestion des accès',
    relatives: 'Proches ayant accès',
    family: 'Cercle familial',
    friends: 'Amis',
    colleagues: 'Collègues',
    other: 'Autres',
    remove: 'Supprimer l\'accès',
    photoDate: 'Date de la photo',
    caption: 'Légende',
    upload: 'Ajouter photo',
    selectDate: 'Sélectionner une date',
    notifications: 'Notifications',
    addChildViaQR: 'Ajouter un enfant',
    profile: 'Mon profil',
  },
  en: {
    appTitle: 'Premier Nuage',
    email: 'Email',
    password: 'Password',
    newPassword: 'New password',
    login: 'Login',
    signup: 'Sign up',
    create: 'Create',
    logout: 'Logout',
    photos: 'Photos',
    accessRequests: 'Access Requests',
    approve: 'Approve',
    deny: 'Deny',
    name: 'First name',
    lastName: 'Last name',
    bio: 'Bio',
    parent1: 'Parent 1',
    parent2: 'Parent 2',
    weight: 'Weight (g)',
    height: 'Height (cm)',
    bloodType: 'Blood type',
    eyeColor: 'Eye color',
    hairColor: 'Hair color',
    allergies: 'Allergies',
    profilePicture: 'Profile picture (URL)',
    birthDate: 'Birth date',
    relationship: 'Relationship',
    children: 'Children',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    accessManagement: 'Access Management',
    relatives: 'Relatives with access',
    family: 'Family',
    friends: 'Friends',
    colleagues: 'Colleagues',
    other: 'Other',
    remove: 'Remove access',
    photoDate: 'Photo date',
    caption: 'Caption',
    upload: 'Add photo',
    selectDate: 'Select a date',
    notifications: 'Notifications',
    addChildViaQR: 'Add a child',
    profile: 'My profile',
  },
};

function App() {
  const [language, setLanguage] = useState('fr');
  const [userType, setUserType] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('auth');
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [childAccess, setChildAccess] = useState([]);
  const [editingChild, setEditingChild] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', lastName: '', childName: '', birthDate: '',
    weight: '', height: '', parent1Name: '', parent2Name: '', bio: '',
    bloodType: '', eyeColor: '', hairColor: '', allergies: '', profilePicture: '',
    qrCodeId: '', relationship: '', childBirthDate: '', caption: '', photoDate: ''
  });
  const [loading, setLoading] = useState(false);

  const t = translations[language];

  const hashPassword = (password) => btoa(password);
  const verifyPassword = (password, hash) => btoa(password) === hash;

  // ===== LOAD PHOTOS FROM DATABASE =====
  const loadPhotos = async (childId) => {
    try {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('child_id', childId)
        .order('uploaded_at', { ascending: false });
      setPhotos(data || []);
    } catch (err) {
      console.error('Erreur chargement photos:', err);
      setPhotos([]);
    }
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
      setFormData({ ...formData, email: '', password: '' });
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
      setView('parent-login');
      setFormData({ ...formData, email: '', password: '' });
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
      loadRelativeChildren(data.id);
      setView('relative-dashboard');
      setFormData({ ...formData, email: '', password: '' });
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== RELATIVE SIGNUP VIA QR =====
  const handleRelativeSignupViaQR = async (qrCodeId) => {
    setLoading(true);
    try {
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

      const { error: signupError } = await supabase
        .from('relatives')
        .insert({
          email: formData.email,
          name: formData.name,
          password_hash: hashPassword(formData.password),
          relationship: formData.relationship || null,
          birth_date: formData.childBirthDate || null,
        });

      if (signupError) throw signupError;

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

      alert('Demande d\'accès envoyée !');
      setFormData({ ...formData, email: '', password: '', name: '', relationship: '', childBirthDate: '', qrCodeId: '' });
      setView('auth');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== RELATIVE ADD CHILD VIA QR (already logged in) =====
  const handleRelativeAddChildViaQR = async (qrCodeId) => {
    setLoading(true);
    try {
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

      await supabase
        .from('access_requests')
        .insert({
          child_id: childData.id,
          relative_id: user.id,
          status: 'pending',
        });

      alert('Demande d\'accès envoyée aux parents !');
      setFormData({ ...formData, qrCodeId: '' });
      setView('relative-dashboard');
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

  const loadAccessRequests = async (childId) => {
    const { data } = await supabase
      .from('access_requests')
      .select('*, relatives(name, email)')
      .eq('child_id', childId)
      .eq('status', 'pending');
    setAccessRequests(data || []);
  };

  const loadChildAccess = async (childId) => {
    const { data } = await supabase
      .from('child_access')
      .select('*, relatives(name, email)')
      .eq('child_id', childId)
      .eq('status', 'active');
    setChildAccess(data || []);
  };

  const loadRelativeChildren = async (relativeId) => {
    const { data } = await supabase
      .from('access_requests')
      .select('*, children(*)')
      .eq('relative_id', relativeId)
      .eq('status', 'approved');

    if (data) {
      setChildren(data.map(r => r.children));
    }
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
          last_name: formData.lastName,
          birth_date: formData.birthDate,
          bio: formData.bio,
          parent1_name: formData.parent1Name,
          parent2_name: formData.parent2Name,
          weight: formData.weight || null,
          height: formData.height || null,
          blood_type: formData.bloodType || null,
          eye_color: formData.eyeColor || null,
          hair_color: formData.hairColor || null,
          allergies: formData.allergies || null,
          profile_picture: formData.profilePicture || null,
          qr_code_id: qrCodeId,
        });

      if (error) throw error;

      loadParentChildren(user.id);
      setFormData({ ...formData, childName: '', lastName: '', birthDate: '', bio: '', parent1Name: '', parent2Name: '', weight: '', height: '', bloodType: '', eyeColor: '', hairColor: '', allergies: '', profilePicture: '' });
      setView('parent-dashboard');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== PARENT EDIT CHILD =====
  const handleEditChild = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('children')
        .update({
          name: editingChild.name,
          last_name: editingChild.last_name,
          bio: editingChild.bio,
          parent1_name: editingChild.parent1_name,
          parent2_name: editingChild.parent2_name,
          weight: editingChild.weight,
          height: editingChild.height,
          blood_type: editingChild.blood_type,
          eye_color: editingChild.eye_color,
          hair_color: editingChild.hair_color,
          allergies: editingChild.allergies,
          profile_picture: editingChild.profile_picture,
        })
        .eq('id', editingChild.id);

      if (error) throw error;

      loadParentChildren(user.id);
      setSelectedChild({ ...selectedChild, ...editingChild });
      setEditingChild(null);
      alert('Enfant modifié !');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== DELETE CHILD =====
  const handleDeleteChild = async (childId) => {
    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le profil de ${selectedChild.name} ? Cette action est irréversible.`);
    
    if (!confirmed) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

      if (error) throw error;

      alert('Profil supprimé avec succès');
      loadParentChildren(user.id);
      setView('parent-dashboard');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== RELATIVE EDIT PROFILE =====
  const handleEditProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = {
        name: editingProfile.name,
        relationship: editingProfile.relationship,
        birth_date: editingProfile.birth_date,
      };

      if (editingProfile.newPassword) {
        updateData.password_hash = hashPassword(editingProfile.newPassword);
      }

      const { error } = await supabase
        .from('relatives')
        .update(updateData)
        .eq('id', editingProfile.id);

      if (error) throw error;

      setUser({ ...user, ...editingProfile });
      setEditingProfile(null);
      alert('Profil modifié !');
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
      const fileInput = e.target.querySelector('input[type="file"]');
      const file = fileInput?.files[0];
      const caption = (e.target.caption?.value || '').trim();
      const photoDate = e.target.photoDate?.value || null;

      if (!file) {
        alert('Veuillez sélectionner un fichier');
        setLoading(false);
        return;
      }

      const fileName = `${selectedChild.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { data, error } = await supabase
        .storage
        .from('photos')
        .upload(fileName, file);

      if (error) throw error;

      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          child_id: selectedChild.id,
          uploaded_by: user.id,
          caption: caption || null,
          photo_date: photoDate,
          file_path: fileName,
        });

      if (dbError) throw dbError;

      e.target.reset();
      loadPhotos(selectedChild.id);
      alert('✅ Photo ajoutée avec succès !');
    } catch (err) {
      console.error('Erreur upload:', err);
      alert('❌ Erreur : ' + err.message);
    }
    setLoading(false);
  };

  // ===== APPROVE/DENY ACCESS =====
  const handleApproveAccess = async (requestId, relativeId) => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('access_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const { error: accessError } = await supabase
        .from('child_access')
        .insert({
          child_id: selectedChild.id,
          relative_id: relativeId,
          category: 'family',
          status: 'active',
        });

      if (accessError) throw accessError;

      loadAccessRequests(selectedChild.id);
      loadChildAccess(selectedChild.id);
      alert('Accès approuvé !');
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

  const handleRemoveAccess = async (accessId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('child_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;

      loadChildAccess(selectedChild.id);
      alert('Accès supprimé');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
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
          <img src="/logo.png" alt="Premier Nuage" style={{width: '200px', height: 'auto', margin: '0 auto 30px', display: 'block'}} />
          <div className="language-switcher">
            <button onClick={() => setLanguage('fr')} className={language === 'fr' ? 'active' : ''}>FR</button>
            <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>EN</button>
          </div>

          {view === 'auth' && (
            <div className="auth-choices">
              <button className="btn-primary" onClick={() => setView('parent-login')}>👨‍👩‍👧 Parents</button>
              <button className="btn-secondary" onClick={() => setView('relative-join')}>👥 Proches</button>
            </div>
          )}

          {view === 'parent-login' && (
            <div>
              <h2>Parents</h2>
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
              <h2>Parents - {t.signup}</h2>
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
              <h2>Proches</h2>
              <form onSubmit={(e) => { e.preventDefault(); setView('relative-qr'); }}>
                <button type="submit">Avez-vous un code QR ?</button>
              </form>
              <button onClick={() => setView('relative-login')} style={{marginTop: '10px'}}>J'ai déjà un compte</button>
              <button onClick={() => setView('auth')}>← Retour</button>
            </div>
          )}

          {view === 'relative-qr' && (
            <div>
              <h2>Proches</h2>
              <form onSubmit={(e) => { e.preventDefault(); setFormData({...formData, qrCodeId: e.target.qrCode.value}); setView('relative-signup'); }}>
                <input type="text" name="qrCode" placeholder="Code QR" required />
                <button type="submit">Continuer</button>
              </form>
              <button onClick={() => setView('relative-join')}>← Retour</button>
            </div>
          )}

          {view === 'relative-signup' && (
            <div>
              <h2>Proches - {t.signup}</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleRelativeSignupViaQR(formData.qrCodeId); }}>
                <input type="text" placeholder={t.name} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <input type="email" placeholder={t.email} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder={t.password} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <input type="text" placeholder={t.relationship} value={formData.relationship} onChange={(e) => setFormData({...formData, relationship: e.target.value})} />
                <input type="date" placeholder={t.birthDate} value={formData.childBirthDate} onChange={(e) => setFormData({...formData, childBirthDate: e.target.value})} />
                <button type="submit" disabled={loading}>{t.signup}</button>
              </form>
              <button onClick={() => setView('relative-qr')}>← Retour</button>
            </div>
          )}

          {view === 'relative-login' && (
            <div>
              <h2>Proches</h2>
              <form onSubmit={handleRelativeLogin}>
                <input type="email" placeholder={t.email} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder={t.password} value={formData.password} onChange((e) => setFormData({...formData, password: e.target.value})} required />
                <button type="submit" disabled={loading}>{t.login}</button>
              </form>
              <button onClick={() => setView('relative-join')}>← Retour</button>
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
          <h1>Parents</h1>
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
                loadChildAccess(child.id);
                setView('parent-photos');
              }} style={{cursor: 'pointer'}}>
                {child.profile_picture && <img src={child.profile_picture} alt={child.name} style={{width: '50px', height: '50px', borderRadius: '50%'}} />}
                <h3>{child.name} {child.last_name}</h3>
                <p>{new Date(child.birth_date).toLocaleDateString()}</p>
              </div>
            ))}
            <button className="btn-primary" onClick={() => setView('parent-create-child')}>➕ {t.children}</button>
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
          <h2>Créer un enfant</h2>
          <form onSubmit={handleCreateChild}>
            <label>{t.name}</label>
            <input type="text" placeholder={t.name} value={formData.childName} onChange={(e) => setFormData({...formData, childName: e.target.value})} required />
            
            <label>{t.lastName}</label>
            <input type="text" placeholder={t.lastName} value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
            
            <label>{t.birthDate}</label>
            <input type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} required />
            
            <label>{t.bio}</label>
            <textarea placeholder={t.bio} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} />
            
            <label>{t.parent1}</label>
            <input type="text" placeholder={t.parent1} value={formData.parent1Name} onChange={(e) => setFormData({...formData, parent1Name: e.target.value})} />
            
            <label>{t.parent2}</label>
            <input type="text" placeholder={t.parent2} value={formData.parent2Name} onChange={(e) => setFormData({...formData, parent2Name: e.target.value})} />
            
            <label>{t.weight}</label>
            <input type="number" placeholder={t.weight} value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
            
            <label>{t.height}</label>
            <input type="number" placeholder={t.height} value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} />
            
            <label>{t.bloodType}</label>
            <input type="text" placeholder={t.bloodType} value={formData.bloodType} onChange={(e) => setFormData({...formData, bloodType: e.target.value})} />
            
            <label>{t.eyeColor}</label>
            <input type="text" placeholder={t.eyeColor} value={formData.eyeColor} onChange={(e) => setFormData({...formData, eyeColor: e.target.value})} />
            
            <label>{t.hairColor}</label>
            <input type="text" placeholder={t.hairColor} value={formData.hairColor} onChange={(e) => setFormData({...formData, hairColor: e.target.value})} />
            
            <label>{t.allergies}</label>
            <input type="text" placeholder={t.allergies} value={formData.allergies} onChange={(e) => setFormData({...formData, allergies: e.target.value})} />
            
            <label>{t.profilePicture}</label>
            <input type="text" placeholder={t.profilePicture} value={formData.profilePicture} onChange={(e) => setFormData({...formData, profilePicture: e.target.value})} />
            
            <button type="submit" disabled={loading}>{t.create}</button>
          </form>
          <button onClick={() => setView('parent-dashboard')}>← Retour</button>
        </div>
      </div>
    );
  }

  // ===== PARENT PHOTOS VIEW (NEW GRID LAYOUT) =====
  if (userType === 'parent' && view === 'parent-photos' && selectedChild) {
    const daysOld = Math.floor((new Date() - new Date(selectedChild.birth_date)) / (1000 * 60 * 60 * 24));
    const birthDate = new Date(selectedChild.birth_date);
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayOfWeek = daysOfWeek[birthDate.getDay()];

    return (
      <div className="app">
        <div className="photos-container" style={{maxWidth: '800px', margin: '0 auto', padding: '20px'}}>
          
          {/* En-tête avec info enfant */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #ede6e1'
          }}>
            {selectedChild.profile_picture && (
              <img
                src={selectedChild.profile_picture}
                alt={selectedChild.name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
            )}
            <div style={{flex: 1}}>
              <h2 style={{margin: '0 0 5px 0', fontSize: '1.5rem'}}>{selectedChild.name}</h2>
              <p style={{margin: '0 0 10px 0', color: '#666', fontSize: '0.9rem'}}>
                {dayOfWeek} {birthDate.toLocaleDateString()} • {daysOld} jours
              </p>
              {selectedChild.bio && (
                <p style={{margin: 0, color: '#666', fontSize: '0.95rem', fontStyle: 'italic'}}>"{selectedChild.bio}"</p>
              )}
            </div>
          </div>

          {/* Formulaire upload photos (parents seulement) */}
          <form onSubmit={handleAddPhoto} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #ede6e1'
          }}>
            <h3 style={{marginTop: 0}}>Ajouter une photo</h3>
            <input type="text" name="caption" placeholder="Légende (optionnel)" style={{width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ede6e1', borderRadius: '8px'}} />
            <input type="file" name="photo" accept="image/*,video/*" required style={{width: '100%', marginBottom: '10px'}} />
            <input type="date" name="photoDate" style={{width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ede6e1', borderRadius: '8px'}} />
            <button type="submit" disabled={loading} style={{width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ff6b9d, #ff4d7d)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}>📸 Ajouter photo</button>
          </form>

          {/* Grille de photos 4 colonnes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => {
                  setGalleryStartIndex(index);
                  setGalleryOpen(true);
                }}
                style={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  aspectRatio: '1',
                  background: '#f0f0f0',
                  border: '1px solid #ede6e1'
                }}
              >
                <img
                  src={`https://wxhcynlcjjdjptoxijhc.supabase.co/storage/v1/object/public/photos/${photo.file_path}`}
                  alt={photo.caption}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23eee" width="100" height="100"/%3E%3C/svg%3E';
                  }}
                />
              </div>
            ))}
          </div>

          {photos.length === 0 && (
            <p style={{textAlign: 'center', color: '#999', padding: '40px 20px'}}>Aucune photo pour le moment</p>
          )}

          <div style={{display: 'flex', gap: '10px', marginTop: '30px'}}>
            <button onClick={() => { setEditingChild(selectedChild); setView('parent-edit-child'); }} style={{flex: 1, padding: '12px', background: '#f8e8d8', border: '1px solid #ede6e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>✏️ Modifier profil</button>
            <button onClick={() => setView('parent-access')} style={{flex: 1, padding: '12px', background: '#f8e8d8', border: '1px solid #ede6e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>👥 Accès</button>
            <button onClick={() => setView('parent-access-requests')} style={{flex: 1, padding: '12px', background: '#f8e8d8', border: '1px solid #ede6e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>📋 Demandes</button>
          </div>

          <button onClick={() => handleDeleteChild(selectedChild.id)} style={{width: '100%', marginTop: '10px', padding: '12px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>🗑️ Supprimer le profil</button>
          <button onClick={() => setView('parent-dashboard')} style={{width: '100%', marginTop: '10px', padding: '12px', background: '#f5f5f5', border: '1px solid #ede6e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>← Retour</button>
          <button className="btn-logout" onClick={handleLogout} style={{width: '100%', marginTop: '10px'}}>{t.logout}</button>
        </div>

        {galleryOpen && (
          <PhotoGallery
            photos={photos}
            onClose={() => setGalleryOpen(false)}
            userType={userType}
            user={user}
            selectedChild={selectedChild}
          />
        )}
      </div>
    );
  }

  // ===== PARENT EDIT CHILD =====
  if (userType === 'parent' && view === 'parent-edit-child' && editingChild) {
    return (
      <div className="app">
        <div className="form-container">
          <h2>Modifier {editingChild.name}</h2>
          <form onSubmit={handleEditChild}>
            <label>{t.name}</label>
            <input type="text" value={editingChild.name} onChange={(e) => setEditingChild({...editingChild, name: e.target.value})} />
            
            <label>{t.lastName}</label>
            <input type="text" value={editingChild.last_name || ''} onChange={(e) => setEditingChild({...editingChild, last_name: e.target.value})} />
            
            <label>{t.bio}</label>
            <textarea value={editingChild.bio || ''} onChange={(e) => setEditingChild({...editingChild, bio: e.target.value})} />
            
            <label>{t.parent1}</label>
            <input type="text" value={editingChild.parent1_name || ''} onChange={(e) => setEditingChild({...editingChild, parent1_name: e.target.value})} />
            
            <label>{t.parent2}</label>
            <input type="text" value={editingChild.parent2_name || ''} onChange={(e) => setEditingChild({...editingChild, parent2_name: e.target.value})} />
            
            <label>{t.weight}</label>
            <input type="number" value={editingChild.weight || ''} onChange={(e) => setEditingChild({...editingChild, weight: e.target.value})} />
            
            <label>{t.height}</label>
            <input type="number" value={editingChild.height || ''} onChange={(e) => setEditingChild({...editingChild, height: e.target.value})} />
            
            <label>{t.bloodType}</label>
            <input type="text" value={editingChild.blood_type || ''} onChange={(e) => setEditingChild({...editingChild, blood_type: e.target.value})} />
            
            <label>{t.eyeColor}</label>
            <input type="text" value={editingChild.eye_color || ''} onChange={(e) => setEditingChild({...editingChild, eye_color: e.target.value})} />
            
            <label>{t.hairColor}</label>
            <input type="text" value={editingChild.hair_color || ''} onChange={(e) => setEditingChild({...editingChild, hair_color: e.target.value})} />
            
            <label>{t.allergies}</label>
            <input type="text" value={editingChild.allergies || ''} onChange={(e) => setEditingChild({...editingChild, allergies: e.target.value})} />
            
            <label>{t.profilePicture}</label>
            <input type="text" value={editingChild.profile_picture || ''} onChange={(e) => setEditingChild({...editingChild, profile_picture: e.target.value})} />
            
            <button type="submit" disabled={loading}>{t.save}</button>
          </form>
          <button onClick={() => { setEditingChild(null); setView('parent-photos'); }}>{t.cancel}</button>
        </div>
      </div>
    );
  }

  // ===== PARENT ACCESS MANAGEMENT =====
  if (userType === 'parent' && view === 'parent-access' && selectedChild) {
    return (
      <div className="app">
        <div className="access-container">
          <h2>👥 {t.accessManagement}</h2>

          <div className="relatives-list">
            <h3>{t.relatives}</h3>
            {childAccess && childAccess.length > 0 ? (
              childAccess.map(access => (
                <div key={access.id} className="relative-card" style={{border: '1px solid #ddd', padding: '10px', margin: '10px 0', borderRadius: '8px'}}>
                  <p><strong>{access.relatives?.name}</strong></p>
                  <p>{access.relatives?.email}</p>
                  <p>{access.category}</p>
                  <button onClick={() => handleRemoveAccess(access.id)} className="btn-logout">{t.remove}</button>
                </div>
              ))
            ) : (
              <p className="empty">Pas de proches</p>
            )}
          </div>

          <button onClick={() => setView('parent-photos')}>← Retour</button>
        </div>
      </div>
    );
  }

  // ===== PARENT ACCESS REQUESTS =====
  if (userType === 'parent' && view === 'parent-access-requests' && selectedChild) {
    return (
      <div className="app">
        <div className="access-container">
          <h2>📋 {t.accessRequests}</h2>

          <div className="requests-list">
            {accessRequests && accessRequests.length > 0 ? (
              accessRequests.map(request => (
                <div key={request.id} className="request-card" style={{border: '1px solid #ddd', padding: '10px', margin: '10px 0', borderRadius: '8px'}}>
                  <p><strong>{request.relatives?.name}</strong></p>
                  <p>{request.relatives?.email}</p>
                  <div className="request-buttons" style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                    <button onClick={() => handleApproveAccess(request.id, request.relative_id)} className="btn-primary">{t.approve}</button>
                    <button onClick={() => handleDenyAccess(request.id)} className="btn-logout">{t.deny}</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty">Pas de demandes</p>
            )}
          </div>

          <button onClick={() => setView('parent-photos')}>← Retour</button>
        </div>
      </div>
    );
  }

  // ===== RELATIVE DASHBOARD =====
  if (userType === 'relative' && view === 'relative-dashboard') {
    return (
      <div className="app">
        <div className="family-container">
          <h1>Proches</h1>
          <div className="language-switcher">
            <button onClick={() => setLanguage('fr')} className={language === 'fr' ? 'active' : ''}>FR</button>
            <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>EN</button>
          </div>

          <div className="children-list">
            <h2>{t.children}</h2>
            {children && children.length > 0 ? (
              children.map(child => (
                <div key={child.id} className="child-card" onClick={() => {
                  setSelectedChild(child);
                  loadPhotos(child.id);
                  setView('relative-photos');
                }} style={{cursor: 'pointer'}}>
                  {child.profile_picture && <img src={child.profile_picture} alt={child.name} style={{width: '50px', height: '50px', borderRadius: '50%'}} />}
                  <h3>{child.name} {child.last_name}</h3>
                  {child.bio && <p>{child.bio}</p>}
                </div>
              ))
            ) : (
              <p className="empty">Pas d'enfants approuvés</p>
            )}
            <button className="btn-primary" onClick={() => setView('relative-add-child')} style={{marginTop: '10px'}}>{t.addChildViaQR}</button>
          </div>

          <button onClick={() => { setEditingProfile(user); setView('relative-edit-profile'); }} style={{marginTop: '10px'}}>{t.profile}</button>
          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
        </div>
      </div>
    );
  }

  // ===== RELATIVE ADD CHILD VIA QR =====
  if (userType === 'relative' && view === 'relative-add-child') {
    return (
      <div className="app">
        <div className="form-container">
          <h2>{t.addChildViaQR}</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleRelativeAddChildViaQR(e.target.qrCode.value);
          }}>
            <input type="text" name="qrCode" placeholder="Code QR" required />
            <button type="submit" disabled={loading}>Ajouter</button>
          </form>
          <button onClick={() => setView('relative-dashboard')}>← Retour</button>
        </div>
      </div>
    );
  }

  // ===== RELATIVE EDIT PROFILE =====
  if (userType === 'relative' && view === 'relative-edit-profile' && editingProfile) {
    return (
      <div className="app">
        <div className="form-container">
          <h2>Mon profil</h2>
          <form onSubmit={handleEditProfile}>
            <label>{t.name}</label>
            <input type="text" value={editingProfile.name} onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})} />
            
            <label>{t.relationship}</label>
            <input type="text" value={editingProfile.relationship || ''} onChange={(e) => setEditingProfile({...editingProfile, relationship: e.target.value})} />
            
            <label>{t.birthDate}</label>
            <input type="date" value={editingProfile.birth_date || ''} onChange={(e) => setEditingProfile({...editingProfile, birth_date: e.target.value})} />
            
            <label>{t.newPassword}</label>
            <input type="password" placeholder="Laisser vide pour ne pas changer" onChange={(e) => setEditingProfile({...editingProfile, newPassword: e.target.value})} />
            
            <button type="submit" disabled={loading}>{t.save}</button>
          </form>
          <button onClick={() => { setEditingProfile(null); setView('relative-dashboard'); }}>{t.cancel}</button>
        </div>
      </div>
    );
  }

  // ===== RELATIVE PHOTOS VIEW (NEW GRID LAYOUT) =====
  if (userType === 'relative' && view === 'relative-photos' && selectedChild) {
    const daysOld = Math.floor((new Date() - new Date(selectedChild.birth_date)) / (1000 * 60 * 60 * 24));
    const birthDate = new Date(selectedChild.birth_date);
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayOfWeek = daysOfWeek[birthDate.getDay()];

    return (
      <div className="app">
        <div className="photos-container" style={{maxWidth: '800px', margin: '0 auto', padding: '20px'}}>
          
          {/* En-tête avec info enfant */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #ede6e1'
          }}>
            {selectedChild.profile_picture && (
              <img
                src={selectedChild.profile_picture}
                alt={selectedChild.name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
            )}
            <div style={{flex: 1}}>
              <h2 style={{margin: '0 0 5px 0', fontSize: '1.5rem'}}>{selectedChild.name}</h2>
              <p style={{margin: '0 0 10px 0', color: '#666', fontSize: '0.9rem'}}>
                {dayOfWeek} {birthDate.toLocaleDateString()} • {daysOld} jours
              </p>
              {selectedChild.bio && (
                <p style={{margin: 0, color: '#666', fontSize: '0.95rem', fontStyle: 'italic'}}>"{selectedChild.bio}"</p>
              )}
            </div>
          </div>

          {/* Grille de photos 4 colonnes (proches = pas d'upload) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => {
                  setGalleryStartIndex(index);
                  setGalleryOpen(true);
                }}
                style={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  aspectRatio: '1',
                  background: '#f0f0f0',
                  border: '1px solid #ede6e1'
                }}
              >
                <img
                  src={`https://wxhcynlcjjdjptoxijhc.supabase.co/storage/v1/object/public/photos/${photo.file_path}`}
                  alt={photo.caption}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23eee" width="100" height="100"/%3E%3C/svg%3E';
                  }}
                />
              </div>
            ))}
          </div>

          {photos.length === 0 && (
            <p style={{textAlign: 'center', color: '#999', padding: '40px 20px'}}>Aucune photo pour le moment</p>
          )}

          <div style={{display: 'flex', gap: '10px', marginTop: '30px'}}>
            <button onClick={() => { setEditingProfile(user); setView('relative-edit-profile'); }} style={{flex: 1, padding: '12px', background: '#f8e8d8', border: '1px solid #ede6e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>✏️ Mon profil</button>
          </div>

          <button onClick={() => setView('relative-dashboard')} style={{width: '100%', marginTop: '10px', padding: '12px', background: '#f5f5f5', border: '1px solid #ede6e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>← Retour</button>
          <button className="btn-logout" onClick={handleLogout} style={{width: '100%', marginTop: '10px'}}>{t.logout}</button>
        </div>

        {galleryOpen && (
          <PhotoGallery
            photos={photos}
            onClose={() => setGalleryOpen(false)}
            userType={userType}
            user={user}
            selectedChild={selectedChild}
          />
        )}
      </div>
    );
  }

  return <div>Erreur</div>;
}

export default App;
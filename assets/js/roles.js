/* =====================================================================
   Who can see what.

   Four sides:
     visitor  — not logged in
     owner    — a pet owner
     sitter   — a Paw Homie
     admin    — Bilal

   ACCESS below is the single source of truth. Every route is checked
   against it before the page renders, so typing a URL can't get you
   into a side you don't belong to.
   ===================================================================== */

window.ACCESS = {
  /* --- anyone, logged in or not --- */
  welcome:        'public',
  search:         'public',   // browsing builds trust before signup
  profile:        'public',   // but booking/messaging asks you to sign up
  signup:         'public',

  /* --- any signed-in user (owner or sitter) --- */
  messages:       'user',
  chat:           'user',
  notifications:  'user',
  settings:       'user',

  /* --- pet owners only --- */
  dashboard:      'owner',
  booking:        'owner',
  payment:        'owner',
  confirmation:   'owner',
  bookingDetail:  'owner',
  favorites:      'owner',
  bookings:       'owner',
  ownerVerification: 'owner',
  sitterReviews: 'sitter',
  petProfile:     'owner',
  review:         'owner',

  /* --- Paw Homies only --- */
  sitterDashboard:'sitter',
  services:       'sitter',
  availability:   'sitter',
  requests:       'sitter',
  verification:   'sitter',
  payouts:        'sitter',

  /* --- Bilal only --- */
  admin:          'admin'
};

window.Role = {
  profile: null,
  loaded: false,

  async load(force){
    if (this.loaded && !force) return this.profile;
    try { this.profile = await db.getProfile(); }
    catch(e){ this.profile = null; }
    this.loaded = true;
    return this.profile;
  },

  reset(){ this.loaded = false; this.profile = null; if(window.App) window.App._sitterId = null; },

  isGuest(){  return !this.profile; },
  isOwner(){  return !!(this.profile && this.profile.is_owner); },
  isSitter(){ return !!(this.profile && this.profile.is_sitter); },
  isAdmin(){  return !!(this.profile && this.profile.is_admin); },

  /* Admin can see everything. Otherwise match the required level. */
  can(level){
    if (level === 'public') return true;
    if (this.isAdmin()) return true;
    if (this.isGuest()) return false;
    if (level === 'user')   return true;
    if (level === 'owner')  return this.isOwner();
    if (level === 'sitter') return this.isSitter();
    if (level === 'admin')  return this.isAdmin();
    return false;
  },

  /* Where to send someone who isn't allowed here. */
  redirectFor(level){
    if (this.isGuest()) return { page:'signup', msg:'Please log in to continue' };
    if (level === 'sitter') return { page:'dashboard',       msg:'That\u2019s the Paw Homie side \u2014 apply in Settings to join' };
    if (level === 'owner')  return { page:'sitterDashboard', msg:'That\u2019s the pet owner side' };
    if (level === 'admin')  return { page:'dashboard',       msg:'Admins only' };
    return { page:'welcome', msg:'' };
  },

  /* Where "home" is for this person. */
  home(){
    if (this.isGuest()) return 'welcome';
    if (this.isAdmin()) return 'admin';
    if (this.isSitter() && !this.isOwner()) return 'sitterDashboard';
    return 'dashboard';
  }
};

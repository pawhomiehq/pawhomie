/* =====================================================================
   PawHomie data layer
   ---------------------------------------------------------------------
   Every page talks to window.db.* and nothing else. This file decides
   whether those calls hit Supabase or the mock data.

   - config.js has no keys -> mock mode (front end still fully works)
   - config.js has keys     -> live Supabase mode
   ===================================================================== */

/* ------------------------- MOCK DATA (fallback) ------------------------ */
window.MOCK = {
  session: null,   // null = not logged in (guest). set by mock signIn/signUp.
  me: { name:'Aisha', initial:'A' },
  pet: { name:'Milo', initial:'M', kind:'Dog · Beagle', age:'4 yrs' },
  sitters: [
    {id:'sara',   name:'Sara M.', city:'Toronto',   initial:'S', gold:false, rate:42, rating:'4.9', reviews:128, dist:'1.2 km',
     tags:['Fenced yard','Ok with other pets','Garden'], reply:'Replies in 1 hr',
     about:"Dog lover with 6 years of sitting experience. Lots of walks, cuddles, and daily photo updates so you can relax while you're away.", services:['house_sitting','drop_in','walking']},
    {id:'daniel', name:'Daniel K.', city:'North York', initial:'D', gold:true,  rate:38, rating:'4.8', reviews:96,  dist:'2.0 km',
     tags:['House with garden','Cats welcome'], reply:'Replies in 2 hrs',
     about:"Calm, reliable carer who treats every pet like a guest of honour.", services:['house_sitting','boarding','daycare']},
    {id:'priya',  name:'Priya R.', city:'Etobicoke',  initial:'P', gold:false, rate:46, rating:'5.0', reviews:64,  dist:'2.6 km',
     tags:['Fenced yard','Daily photos'], reply:'Replies in 30 min',
     about:"Former vet assistant — your pet is in expert, loving hands.", services:['house_sitting','drop_in','daycare']},
    {id:'marco',  name:'Marco B.', city:'Scarborough',  initial:'M', gold:true,  rate:35, rating:'4.7', reviews:150, dist:'3.1 km',
     tags:['Apartment','Small dogs'], reply:'Replies in 1 hr',
     about:"Energetic and playful — perfect for pups who love their zoomies.", services:['walking','drop_in','daycare']}
  ],
  conversations: [
    {id:'sara', initial:'S', gold:false, name:'Sara M.', city:'Toronto', last:"That's great, booking now!", time:'now', online:true},
    {id:'daniel', initial:'D', gold:true, name:'Daniel K.', city:'North York', last:'Sounds good, see you then.', time:'2h', online:false}
  ],
  notifications: [
    { id:'n1', title:'Sara sent you a message', body:'“Perfect — my backyard’s fully fenced.”', read:false, created_at:new Date(Date.now()-2*60000).toISOString() },
    { id:'n2', title:'Your booking request was sent', body:'Sara M. · Jul 18–21', read:false, created_at:new Date(Date.now()-40*60000).toISOString() },
    { id:'n3', title:'New Paw Homies available near you', body:'3 new sitters in Etobicoke', read:true, created_at:new Date(Date.now()-26*3600000).toISOString() }
  ],
  sitterBookings: [],
  myServices: [{kind:'house_sitting',price:42,enabled:true},{kind:'drop_in',price:20,enabled:true}],
  sitterProfile: { about:'Dog lover with 6 years experience.', rate_per_night:42, published:true, tags:['Fenced yard'] },
  availability: {},
  applicants: [
    { id:'ap1', status:'pending', score:90, passed:true, name:'Priya R.', initial:'P', gold:false, city:'Etobicoke', about:'Former vet assistant, calm with anxious dogs.', rate:46 },
    { id:'ap2', status:'pending', score:80, passed:true, name:'Tom H.', initial:'T', gold:true, city:'Scarborough', about:'Grew up with three rescue dogs.', rate:38 },
    { id:'ap3', status:'pending', score:70, passed:false, name:'Kate L.', initial:'K', gold:false, city:'Toronto', about:'New to sitting but eager to learn.', rate:35 }
  ],
  application: { status:'draft', quiz_score:null, quiz_passed:false },
  ownerVerification: { id_status:'unverified', id_document:'' },
  ownerApplicants: [
    { id:'ow1', name:'Jordan Lee', initial:'J', gold:true,  city:'Toronto',   status:'pending', document:'demo/id' },
    { id:'ow2', name:'Mia R.',     initial:'M', gold:false, city:'Etobicoke', status:'pending', document:'demo/id' }
  ],
  allSitters: [
    { id:'sp1', status:'approved', published:true,  score:90, rate:42, name:'Sara M.',  initial:'S', gold:false, city:'Toronto' },
    { id:'sp2', status:'approved', published:false, score:80, rate:38, name:'Daniel K.', initial:'D', gold:true,  city:'North York' },
    { id:'sp3', status:'pending',  published:false, score:90, rate:46, name:'Priya R.',  initial:'P', gold:false, city:'Etobicoke' }
  ],
  allBookings: [
    { id:'b1', status:'completed', total:156.62, owner:'Jordan Lee', initial:'J', sitter:'Sara M.',  dates:'Aug 1–4' },
    { id:'b2', status:'accepted',  total:80,     owner:'Sam T.',     initial:'S', sitter:'Daniel K.', dates:'Aug 10–12' },
    { id:'b3', status:'pending',   total:126,    owner:'Mia R.',     initial:'M', sitter:'Priya R.',  dates:'Aug 15–18' }
  ],
  allReviews: [
    { id:'r1', rating:5, body:'Sara was amazing, sent photos every day!', author:'Jordan Lee', sitter:'Sara M.' },
    { id:'r2', rating:2, body:'Spammy nonsense review here.', author:'Anon', sitter:'Daniel K.' }
  ],
  requests: [
    {initial:'A', gold:true, name:'Aisha K.', pet:'Milo (Beagle)', dates:'Jul 18–21', price:'$138'},
    {initial:'T', gold:false, name:'Tom H.', pet:'Luna (Cat)', dates:'Jul 22', price:'$20'},
    {initial:'N', gold:true, name:'Nina S.', pet:'Cooper (Lab)', dates:'Jul 25–27', price:'$126'}
  ]
};

window.App = { currentSitter: window.MOCK.sitters[0], user: null, searchService: 'house_sitting', searchArea: '', _sitterId: null };

/* The services PawHomie offers. The "How" in Where / When / Who / How. */
window.SERVICES = [
  { id:'house_sitting', label:'House sitting', icon:'home', blurb:'A Paw Homie stays over at your place' },
  { id:'drop_in',       label:'Drop-in visits', icon:'pin', blurb:'Short visits to feed, play & check in' },
  { id:'walking',       label:'Dog walking',   icon:'paw',  blurb:'Daily walks to keep tails wagging' },
  { id:'boarding',      label:'Boarding',      icon:'home', blurb:"Your pet stays at the Paw Homie's home" },
  { id:'daycare',       label:'Daycare',       icon:'cal',  blurb:"Daytime care while you're out" }
];
window.serviceLabel = function(id){
  var s = window.SERVICES.find(function(x){ return x.id === id; });
  return s ? s.label : 'House sitting';
};

/* --------------------------- Supabase client -------------------------- */
window.sb = null;
if (window.USE_SUPABASE && window.supabase) {
  window.sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'pawhomie-auth' }
  });
  console.log('PawHomie: connected to Supabase');
} else {
  console.log('PawHomie: running on DEMO data (no Supabase keys in config.js)');
  // Make it impossible to miss that this is not real data.
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function(){
      var bar = document.createElement('div');
      bar.id = 'demoBanner';
      bar.textContent = 'DEMO MODE \u2014 not connected to your database. Paste your Supabase keys in assets/js/config.js to use real data.';
      document.body.appendChild(bar);
    });
  }
}
function LIVE(){ return !!window.sb; }

/* ------------------------------ helpers ------------------------------- */
function kmBetween(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  var R = 6371, toRad = function(d){ return d * Math.PI / 180; };
  var dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  var s = Math.pow(Math.sin(dLat/2),2) +
          Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.pow(Math.sin(dLng/2),2);
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
}

/* Turn a sitter_cards row into the exact shape the UI already renders. */
function toCard(row) {
  var km = kmBetween(CONFIG.DEFAULT_LOCATION, { lat: row.lat, lng: row.lng });
  return {
    id: row.id,
    name: row.name || '',
    initial: row.initial || '?',
    gold: !!row.gold,
    rate: Number(row.rate),
    rating: Number(row.rating).toFixed(1),
    reviews: Number(row.reviews) || 0,
    dist: km == null ? '—' : km.toFixed(1) + ' km',
    tags: row.tags || [],
    reply: row.reply || 'Replies in 1 hr',
    about: row.about || '',
    city: row.city || ''
  };
}

function timeAgo(iso) {
  var mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return mins + 'm';
  if (mins < 1440) return Math.floor(mins/60) + 'h';
  return Math.floor(mins/1440) + 'd';
}

function fmtRange(a, b) {
  var o = { month:'short', day:'numeric' };
  var s = new Date(a).toLocaleDateString('en-CA', o);
  var e = new Date(b).toLocaleDateString('en-CA', o);
  return s === e ? s : s + ' – ' + e;
}

/* ---------------------------------------------------------------------
   ONE place that decides what a booking costs. The booking page, the
   payment page and the row we insert all read from this, so they can
   never disagree.
   --------------------------------------------------------------------- */
function isoDate(d){ return d.toISOString().slice(0,10); }
function addDays(d, n){ var x = new Date(d); x.setDate(x.getDate()+n); return x; }

window.Booking = {
  state: {
    sitterId: null,
    petId: null,
    startDate: isoDate(addDays(new Date(), 3)),
    endDate:   isoDate(addDays(new Date(), 6)),
    note: ''
  },
  nights: function(){
    var ms = new Date(this.state.endDate) - new Date(this.state.startDate);
    return Math.max(1, Math.round(ms / 86400000));
  },
  quote: function(rate){
    var nights   = this.nights();
    var subtotal = Math.round(rate * nights * 100) / 100;
    var fee      = Math.round(subtotal * (CONFIG.SERVICE_FEE_RATE || 0.10) * 100) / 100;
    var tax      = Math.round((subtotal + fee) * (CONFIG.TAX_RATE || 0) * 100) / 100;
    var total    = Math.round((subtotal + fee + tax) * 100) / 100;
    return { nights:nights, subtotal:subtotal, fee:fee, tax:tax, taxLabel:(CONFIG.TAX_LABEL||'Tax'), total:total };
  },
  money: function(n){ return '$' + Number(n).toFixed(2); },
  quoteFor: function(rate, startDate, endDate){
    var ms = new Date(endDate) - new Date(startDate);
    var nights = Math.max(1, Math.round(ms / 86400000));
    var subtotal = Math.round(rate * nights * 100) / 100;
    var fee      = Math.round(subtotal * (CONFIG.SERVICE_FEE_RATE || 0.10) * 100) / 100;
    var tax      = Math.round((subtotal + fee) * (CONFIG.TAX_RATE || 0) * 100) / 100;
    var total    = Math.round((subtotal + fee + tax) * 100) / 100;
    return { nights:nights, subtotal:subtotal, fee:fee, tax:tax, taxLabel:(CONFIG.TAX_LABEL||'Tax'), total:total };
  }
};

/* ------------------------------- the API ------------------------------ */
window.db = {

  /* ---- auth ---- */
  async signUp(email, password, fullName, city) {
    if (!LIVE()) {
      // mock: signing up logs you in (role set right after via setRole)
      window.MOCK.session = { full_name: fullName || 'You', city: city || 'Toronto, ON', is_owner:true, is_sitter:false, is_admin:false };
      return { ok:true, mock:true };
    }
    var res = await sb.auth.signUp({ email: email, password: password, options:{ data:{ full_name: fullName } } });
    if (res.error) throw res.error;
    window.App.user = res.data.user;

    // If Supabase has "Confirm email" ON, there's no session yet — profile is
    // written on first login instead (see ensureProfile).
    if (res.data.session && res.data.user){
      await this._writeProfile(res.data.user.id, { full_name: fullName, city: city });
    } else {
      // stash so we can write it right after they confirm + log in
      window.PENDING_PROFILE = { full_name: fullName, city: city };
    }
    return { ok:true, user:res.data.user, needsConfirm: !res.data.session };
  },

  /* Force the profile row to hold this exact name/city (overwrites any
     stale seeded value). Safe to call more than once. */
  async _writeProfile(userId, fields){
    if (!LIVE() || !userId) return;
    var patch = {};
    if (fields.full_name != null) patch.full_name = fields.full_name;
    if (fields.city) patch.city = fields.city;
    if (!Object.keys(patch).length) return;
    var res = await sb.from('profiles').update(patch).eq('id', userId);
    if (res.error) console.error('_writeProfile:', res.error.message);
  },

  async signIn(email, password) {
    if (!LIVE()) {
      // mock: demo login as a pet owner (email hinting 'sitter' logs in on that side)
      var sitter = /sitter|homie/i.test(email);
      window.MOCK.session = { full_name:'Aisha K.', is_owner:!sitter, is_sitter:sitter, is_admin:false };
      return { ok:true, mock:true };
    }
    var res = await sb.auth.signInWithPassword({ email: email, password: password });
    if (res.error) throw res.error;
    // Block unconfirmed emails from getting a working session.
    if (res.data.user && !res.data.user.email_confirmed_at && !res.data.user.confirmed_at){
      await sb.auth.signOut();
      throw new Error('Please confirm your email first — check your inbox for the link we sent.');
    }
    window.App.user = res.data.user;
    // If they signed up under email-confirmation, write the stashed name/city now.
    if (window.PENDING_PROFILE && res.data.user){
      await this._writeProfile(res.data.user.id, window.PENDING_PROFILE);
      window.PENDING_PROFILE = null;
    }
    return { ok:true, user:res.data.user };
  },

  async resendConfirmation(email) {
    if (!LIVE()) return { ok:true };
    var res = await sb.auth.resend({ type:'signup', email: email });
    if (res.error) throw res.error;
    return { ok:true };
  },

  async sendPasswordReset(email) {
    if (!LIVE()) return { ok:true };
    var redirect = (typeof location !== 'undefined') ? location.origin + location.pathname : undefined;
    var res = await sb.auth.resetPasswordForEmail(email, redirect ? { redirectTo: redirect } : undefined);
    if (res.error) throw res.error;
    return { ok:true };
  },

  async updatePassword(newPassword) {
    if (!LIVE()) return { ok:true };
    var res = await sb.auth.updateUser({ password: newPassword });
    if (res.error) throw res.error;
    return { ok:true };
  },

  async signOut() {
    if (!LIVE()) { window.MOCK.session = null; return { ok:true }; }
    await sb.auth.signOut();
    window.App.user = null;
    return { ok:true };
  },

  async currentUser() {
    if (!LIVE()) return window.MOCK.session ? { id:'mock-user', email:'you@demo.pawhomie.com' } : null;
    var u = null;
    if (window.App.user && window.App.user.id) {
      u = window.App.user;
    } else {
      try {
        var s = await sb.auth.getSession();
        if (s && s.data && s.data.session && s.data.session.user) u = s.data.session.user;
      } catch(e){ /* fall through */ }
      if (!u) {
        var res = await sb.auth.getUser();
        u = (res.data && res.data.user) || null;
      }
    }
    // An unconfirmed email is NOT a logged-in user. Treat as guest.
    if (u && !u.email_confirmed_at && !u.confirmed_at) {
      window.App.user = null;
      return null;
    }
    window.App.user = u;
    return u;
  },

  /* Read the signed-in user's profile row (name, role flags). */
  async getProfile() {
    if (!LIVE()) {
      var m = window.MOCK.session;
      if (!m) return null;                       // not logged in -> guest
      return { full_name:m.full_name, initial:(m.full_name||'Y').charAt(0).toUpperCase(),
               avatar_gold:true, is_owner:!!m.is_owner, is_sitter:!!m.is_sitter, is_admin:!!m.is_admin, city:'Toronto, ON' };
    }
    var user = await this.currentUser();
    if (!user) return null;
    var res = await sb.from('profiles')
      .select('id, full_name, initial, avatar_gold, photo_url, is_owner, is_sitter, is_admin, city')
      .eq('id', user.id).maybeSingle();
    if (res.error) { console.error('getProfile:', res.error.message); return null; }
    if (!res.data) {
      // No profile row yet (e.g. account made before the trigger existed).
      // Create one now so the person can actually use the app.
      var meta = (user.user_metadata || {});
      var name = meta.full_name || (user.email ? user.email.split('@')[0] : 'You');
      var ins = await sb.from('profiles').insert({
        id: user.id,
        full_name: name,
        is_owner: true, is_sitter: false, is_admin: false
      }).select('id, full_name, initial, avatar_gold, photo_url, is_owner, is_sitter, is_admin, city').single();
      if (ins.error) { console.error('getProfile backfill:', ins.error.message); return null; }
      window.App.profile = ins.data;
      return ins.data;
    }
    window.App.profile = res.data;
    return res.data;
  },

  /* Mark the account as owner / sitter / both after signup. */
  async setRole(role) {
    if (!LIVE()) {
      if (window.MOCK.session) {
        window.MOCK.session.is_owner  = role === 'owner'  || role === 'both';
        window.MOCK.session.is_sitter = role === 'sitter' || role === 'both';
      }
      return { ok:true, mock:true };
    }
    var user = await this.currentUser();
    if (!user) throw new Error('Not signed in.');
    var patch = {
      is_owner:  role === 'owner'  || role === 'both',
      is_sitter: role === 'sitter' || role === 'both'
    };
    var res = await sb.from('profiles').update(patch).eq('id', user.id);
    if (res.error) throw res.error;

    // A sitter also needs a sitter_profiles row (unpublished until they set rates).
    if (patch.is_sitter) {
      var exists = await sb.from('sitter_profiles').select('id').eq('profile_id', user.id).maybeSingle();
      if (!exists.data) {
        var ins = await sb.from('sitter_profiles').insert({ profile_id: user.id, published: false });
        if (ins.error) console.error('create sitter_profile:', ins.error.message);
      }
    }
    return { ok:true };
  },

  /* ---- sitters ---- */
  async getSitters(serviceFilter, area) {
    function inArea(c){ return !area || (c.city||'').toLowerCase().indexOf(area.toLowerCase()) > -1; }
    if (!LIVE()) {
      var m = window.MOCK.sitters;
      if (serviceFilter) m = m.filter(function(s){ return (s.services||[]).indexOf(serviceFilter) > -1; });
      if (area) m = m.filter(inArea);
      return m;
    }
    var res = await sb.from('sitter_cards').select('*');
    if (res.error) { console.error('getSitters:', res.error.message); return []; }
    var cards = (res.data || []).map(toCard);
    var svc = await sb.from('services').select('sitter_id, kind').eq('enabled', true);
    if (!svc.error && svc.data) {
      var byId = {};
      svc.data.forEach(function(r){ (byId[r.sitter_id] = byId[r.sitter_id] || []).push(r.kind); });
      cards.forEach(function(c){ c.services = byId[c.id] || []; });
    }
    if (serviceFilter) cards = cards.filter(function(c){ return (c.services||[]).indexOf(serviceFilter) > -1; });
    if (area) cards = cards.filter(inArea);
    return cards;
  },

  async getSitter(id) {
    if (!LIVE()) return window.MOCK.sitters.find(function(s){ return s.id === id; }) || window.MOCK.sitters[0];
    var res = await sb.from('sitter_cards').select('*').eq('id', id).single();
    if (res.error || !res.data) { console.error('getSitter:', res.error && res.error.message); return null; }
    return toCard(res.data);
  },

  /* One call that returns everything needing the current user's attention.
     Used for the red nav badges. */
  async getAwareness() {
    var out = { unreadMessages:0, sitterRequests:0, verifyAction:false, ownerVerifyAction:false };
    if (!LIVE()){
      out.unreadMessages = (window.MOCK.awareUnread||0);
      return out;
    }
    var user = await this.currentUser();
    if (!user) return out;

    // unread messages across my conversations (messages not sent by me, not yet read)
    try {
      var convs = await sb.from('conversations').select('id')
        .or('owner_id.eq.'+user.id+',sitter_id.eq.'+user.id);
      var ids = (convs.data||[]).map(function(c){ return c.id; });
      if (ids.length){
        var msgs = await sb.from('messages').select('id', { count:'exact', head:true })
          .in('conversation_id', ids).is('read_at', null).neq('sender_id', user.id);
        out.unreadMessages = msgs.count || 0;
      }
    } catch(e){ /* ignore */ }

    // role-specific pending actions
    var prof = window.App.profile;
    if (prof && prof.is_sitter){
      try {
        var sid = await this.mySitterId();
        if (sid){
          var reqs = await sb.from('bookings').select('id', { count:'exact', head:true })
            .eq('sitter_id', sid).eq('status','pending');
          out.sitterRequests = reqs.count || 0;
          var sp = await sb.from('sitter_profiles').select('status').eq('id', sid).single();
          if (sp.data && (sp.data.status==='draft' || sp.data.status==='rejected')) out.verifyAction = true;
        }
      } catch(e){ /* ignore */ }
    }
    if (prof && prof.is_owner){
      try {
        var ov = await sb.from('profiles').select('id_status').eq('id', user.id).single();
        if (ov.data && (ov.data.id_status==='unverified' || ov.data.id_status==='rejected')) out.ownerVerifyAction = true;
      } catch(e){ /* ignore */ }
    }
    return out;
  },

  async markConversationRead(conversationId){
    if (!LIVE() || !conversationId) return;
    var user = await this.currentUser();
    if (!user) return;
    await sb.from('messages').update({ read_at:new Date().toISOString() })
      .eq('conversation_id', conversationId).is('read_at', null).neq('sender_id', user.id);
  },

  /* Persist the user's chosen area to their profile. */
  async saveArea(city) {
    if (!LIVE()) { if (window.MOCK.session) window.MOCK.session.city = city; return { ok:true }; }
    var user = await this.currentUser();
    if (!user) return { ok:false };
    var res = await sb.from('profiles').update({ city: city }).eq('id', user.id);
    if (res.error) { console.error('saveArea:', res.error.message); return { ok:false }; }
    return { ok:true };
  },

  /* Update editable profile fields (name, city). */
  async updateProfile(fields) {
    if (!LIVE()) {
      if (window.MOCK.session) Object.assign(window.MOCK.session, fields);
      return { ok:true };
    }
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in first.');
    var patch = {};
    if (fields.full_name != null) patch.full_name = fields.full_name;
    if (fields.city != null) patch.city = fields.city;
    if (fields.photo_url != null) patch.photo_url = fields.photo_url;
    var res = await sb.from('profiles').update(patch).eq('id', user.id);
    if (res.error) throw res.error;
    if (window.App.profile) Object.assign(window.App.profile, patch);
    return { ok:true };
  },

  /* Upload a profile picture to the public avatars bucket, returns its URL. */
  async uploadAvatar(file) {
    if (!LIVE()) return { url: (typeof URL!=='undefined'&&URL.createObjectURL)?URL.createObjectURL(file):'' };
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in first.');
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var path = user.id + '/avatar.' + ext;
    var up = await sb.storage.from('avatars').upload(path, file, { upsert:true, contentType:file.type });
    if (up.error) throw up.error;
    var pub = sb.storage.from('avatars').getPublicUrl(path);
    var url = pub.data ? pub.data.publicUrl : '';
    // cache-bust so the new image shows immediately
    if (url) url = url + '?t=' + Date.now();
    return { url: url };
  },

  /* Reviews about the logged-in sitter (so they can reply). */
  async getMyReviews() {
    if (!LIVE()) return window.MOCK.myReviews || [];
    var sid = await this.mySitterId();
    if (!sid) return [];
    var res = await sb.from('reviews')
      .select('id, rating, body, reply, author:profiles!reviews_author_id_fkey(full_name, initial, avatar_gold)')
      .eq('sitter_id', sid).order('created_at', { ascending:false });
    if (res.error) { console.error('getMyReviews:', res.error.message); return []; }
    return (res.data||[]).map(function(r){
      var a = r.author || {};
      return { id:r.id, rating:r.rating, body:r.body||'', reply:r.reply||'',
               author:a.full_name||'Pet owner', initial:a.initial||'?', gold:!!a.avatar_gold };
    });
  },

  /* Reviews shown on a sitter's public profile (with any provider reply). */
  async getSitterReviews(sitterProfileId) {
    if (!LIVE()) return window.MOCK.sitterReviews || [];
    var res = await sb.from('reviews')
      .select('id, rating, body, reply, created_at, author:profiles!reviews_author_id_fkey(full_name, initial, avatar_gold)')
      .eq('sitter_id', sitterProfileId).order('created_at', { ascending:false }).limit(20);
    if (res.error) { console.error('getSitterReviews:', res.error.message); return []; }
    return (res.data||[]).map(function(r){
      var a = r.author || {};
      return { id:r.id, rating:r.rating, body:r.body||'', reply:r.reply||'',
               author:a.full_name||'Pet owner', initial:a.initial||'?', gold:!!a.avatar_gold };
    });
  },

  /* ---- messaging ---- */
  async getConversations() {
    if (!LIVE()) return window.MOCK.conversations;
    var user = await this.currentUser();
    if (!user) return [];
    var res = await sb.from('conversations')
      .select('id, owner_id, sitter_id,' +
              ' owner:profiles!conversations_owner_id_fkey(full_name, initial, avatar_gold),' +
              ' sitter:profiles!conversations_sitter_id_fkey(full_name, initial, avatar_gold),' +
              ' messages(body, created_at)')
      .order('created_at', { foreignTable:'messages', ascending:false });
    if (res.error) { console.error('getConversations:', res.error.message); return []; }
    return (res.data || []).map(function(c){
      // Show whoever ISN'T me — an owner sees the sitter, a sitter sees the owner.
      var other = (c.owner_id === user.id) ? c.sitter : c.owner;
      var last  = (c.messages && c.messages[0]) || null;
      return {
        id: c.id,
        otherId: (c.owner_id === user.id) ? c.sitter_id : c.owner_id,
        name: other ? other.full_name : 'PawHomie user',
        initial: other ? other.initial : '?',
        gold: other ? other.avatar_gold : false,
        last: last ? last.body : 'Say hello 🐾',
        time: last ? timeAgo(last.created_at) : '',
        online: false
      };
    });
  },

  /* Open the chat with a sitter — reuse the thread if it exists, else start one.
     Note: `sitterProfileId` is a sitter_profiles.id, but conversations store
     profiles.id, so we look that up first. */
  async getOrCreateConversation(sitterProfileId) {
    if (!LIVE()) return { id:'sara', name:'Sara M.', city:'Toronto', initial:'S', gold:false };
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in to send a message.');

    var sp = await sb.from('sitter_profiles')
      .select('profile_id, profile:profiles!sitter_profiles_profile_id_fkey(full_name, initial, avatar_gold)')
      .eq('id', sitterProfileId).single();
    if (sp.error) throw sp.error;

    var otherId = sp.data.profile_id;
    var p = sp.data.profile || {};

    if (otherId === user.id) throw new Error("That's your own profile.");

    var found = await sb.from('conversations').select('id')
      .eq('owner_id', user.id).eq('sitter_id', otherId).maybeSingle();
    if (found.error) throw found.error;

    var convId = found.data && found.data.id;
    if (!convId) {
      var ins = await sb.from('conversations')
        .insert({ owner_id: user.id, sitter_id: otherId }).select('id').single();
      if (ins.error) throw ins.error;
      convId = ins.data.id;
    }
    return { id:convId, otherId:otherId, name:p.full_name || '', initial:p.initial || '?', gold:!!p.avatar_gold };
  },

  /* Live updates — fires cb(message) whenever a new message lands in this thread. */
  subscribeMessages(conversationId, cb) {
    if (!LIVE()) return null;
    var ch = sb.channel('msgs:' + conversationId)
      .on('postgres_changes',
          { event:'INSERT', schema:'public', table:'messages', filter:'conversation_id=eq.' + conversationId },
          function(payload){ cb(payload.new); })
      .subscribe();
    return ch;
  },

  unsubscribe(ch) {
    if (ch && window.sb) sb.removeChannel(ch);
  },

  async getMessages(conversationId) {
    if (!LIVE()) return [];
    var res = await sb.from('messages')
      .select('id, body, image_url, sender_id, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending:true });
    if (res.error) { console.error('getMessages:', res.error.message); return []; }
    return res.data || [];
  },

  async sendMessage(text, conversationId, imageUrl) {
    if (!LIVE()) return { ok:true, mock:true };
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in to send a message.');
    var row = { conversation_id: conversationId, sender_id: user.id, body: text || '' };
    if (imageUrl) row.image_url = imageUrl;
    var res = await sb.from('messages').insert(row);
    if (res.error) throw res.error;
    return { ok:true };
  },

  async uploadChatImage(file, conversationId) {
    if (!LIVE()) return { url:'' };
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in first.');
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var path = user.id + '/' + conversationId + '-' + Date.now() + '.' + ext;
    var up = await sb.storage.from('chat-images').upload(path, file, { upsert:true, contentType:file.type });
    if (up.error) throw up.error;
    var pub = sb.storage.from('chat-images').getPublicUrl(path);
    return { url: pub.data ? pub.data.publicUrl : '' };
  },

  /* Google sign-in (needs Google enabled in Supabase → Auth → Providers). */
  async signInWithGoogle() {
    if (!LIVE()) throw new Error('Google sign-in needs a live connection.');
    var res = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* ---- newsletter (public, insert-only) ---- */
  async subscribe(email) {
    if (!LIVE()) { window.MOCK.subscribed = email; return { ok:true, mock:true }; }
    var res = await sb.from('newsletter').upsert({ email: email });
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* ---- favorites ---- */
  async getFavoriteIds() {
    if (!LIVE()) return window.MOCK.favIds || [];
    var user = await this.currentUser();
    if (!user) return [];
    var res = await sb.from('favorites').select('sitter_id').eq('owner_id', user.id);
    if (res.error) { console.error('getFavoriteIds:', res.error.message); return []; }
    return (res.data || []).map(function(r){ return r.sitter_id; });
  },

  async getFavorites() {
    if (!LIVE()) {
      var ids = window.MOCK.favIds || [];
      return window.MOCK.sitters.filter(function(s){ return ids.indexOf(s.id) > -1; });
    }
    var user = await this.currentUser();
    if (!user) return [];
    var res = await sb.from('favorites')
      .select('sitter:sitter_cards(*)')
      .eq('owner_id', user.id);
    if (res.error) { console.error('getFavorites:', res.error.message); return []; }
    return (res.data || []).filter(function(r){ return r.sitter; }).map(function(r){ return toCard(r.sitter); });
  },

  async toggleFavorite(sitterId, makeFav) {
    if (!LIVE()) {
      window.MOCK.favIds = window.MOCK.favIds || [];
      var i = window.MOCK.favIds.indexOf(sitterId);
      if (makeFav && i < 0) window.MOCK.favIds.push(sitterId);
      if (!makeFav && i > -1) window.MOCK.favIds.splice(i, 1);
      return { ok:true };
    }
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in to save favorites.');
    if (makeFav) {
      var ins = await sb.from('favorites').upsert({ owner_id:user.id, sitter_id:sitterId });
      if (ins.error) throw ins.error;
    } else {
      var del = await sb.from('favorites').delete().eq('owner_id', user.id).eq('sitter_id', sitterId);
      if (del.error) throw del.error;
    }
    return { ok:true };
  },

  /* ---- pets ---- */
  async getPets() {
    if (!LIVE()) return window.MOCK.pets || (window.MOCK.pets = [
      { id:'milo', name:'Milo', species:'Dog', breed:'Beagle', age_years:4,
        notes:'Loves morning walks. A little shy at first, then very cuddly.',
        friendly_with_pets:true, needs_medication:false, microchipped:true }
    ]);
    var user = await this.currentUser();
    if (!user) return [];
    var res = await sb.from('pets')
      .select('id, name, species, breed, age_years, notes, friendly_with_pets, needs_medication, microchipped, vaccination_doc, vaccination_status, vaccination_note')
      .eq('owner_id', user.id).order('created_at');
    if (res.error) { console.error('getPets:', res.error.message); return []; }
    return res.data || [];
  },

  async addPet(pet) {
    if (!LIVE()) {
      window.MOCK.pets = window.MOCK.pets || [];
      pet.id = 'p' + Date.now();
      window.MOCK.pets.push(pet);
      return { ok:true, pet:pet };
    }
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in first.');
    var res = await sb.from('pets').insert({
      owner_id: user.id,
      name: pet.name,
      species: pet.species || 'Dog',
      breed: pet.breed || null,
      age_years: pet.age_years == null ? null : pet.age_years,
      notes: pet.notes || null,
      friendly_with_pets: !!pet.friendly_with_pets,
      needs_medication: !!pet.needs_medication,
      microchipped: !!pet.microchipped
    }).select().single();
    if (res.error) throw res.error;
    return { ok:true, pet:res.data };
  },

  async updatePet(id, patch) {
    if (!LIVE()) {
      var list = window.MOCK.pets || [];
      var p = list.find(function(x){ return x.id === id; });
      if (p) Object.keys(patch).forEach(function(k){ p[k] = patch[k]; });
      return { ok:true };
    }
    var res = await sb.from('pets').update(patch).eq('id', id);
    if (res.error) throw res.error;
    return { ok:true };
  },

  async deletePet(id) {
    if (!LIVE()) {
      window.MOCK.pets = (window.MOCK.pets || []).filter(function(x){ return x.id !== id; });
      return { ok:true };
    }
    var res = await sb.from('pets').delete().eq('id', id);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* ---- bookings ---- */
  async getMyBookings() {
    if (!LIVE()) return window.MOCK.myBookings || (window.MOCK.myBookings = [
      { id:'demo-bk1', sitterName:'Sara M.', initial:'S', gold:false, petName:'Milo',
        dates:fmtRange(Booking.state.startDate, Booking.state.endDate), total:156.62, status:'pending' }
    ]);
    var user = await this.currentUser();
    if (!user) return [];
    var res = await sb.from('bookings')
      .select('id, start_date, end_date, total, status, pet:pets(name), sitter:sitter_profiles(profile:profiles!sitter_profiles_profile_id_fkey(full_name, initial, avatar_gold))')
      .eq('owner_id', user.id)
      .order('created_at', { ascending:false });
    if (res.error) { console.error('getMyBookings:', res.error.message); return []; }
    return (res.data || []).map(function(b){
      var p = b.sitter && b.sitter.profile ? b.sitter.profile : null;
      return {
        id: b.id,
        sitterName: p ? p.full_name : 'Paw Homie',
        initial: p ? p.initial : '?',
        gold: p ? p.avatar_gold : false,
        petName: b.pet ? b.pet.name : '',
        dates: fmtRange(b.start_date, b.end_date),
        total: Number(b.total),
        status: b.status
      };
    });
  },

  /* The sitter_profiles.id for the logged-in Paw Homie (cached). */
  async mySitterId() {
    if (!LIVE()) return 'mock-sitter';
    if (window.App._sitterId) return window.App._sitterId;
    var user = await this.currentUser();
    if (!user) return null;
    var res = await sb.from('sitter_profiles').select('id').eq('profile_id', user.id).maybeSingle();
    if (res.error || !res.data) return null;
    window.App._sitterId = res.data.id;
    return res.data.id;
  },

  async getRequests() {
    if (!LIVE()) return window.MOCK.requests;
    var sid = await this.mySitterId();
    if (!sid) return [];
    var res = await sb.from('bookings')
      .select('id, start_date, end_date, subtotal, service_fee, tax, total, status, note, kind,' +
              ' owner:profiles!bookings_owner_id_fkey(full_name, initial, avatar_gold),' +
              ' pet:pets(name, breed, species)')
      .eq('sitter_id', sid)
      .eq('status', 'pending')
      .order('created_at', { ascending:false });
    if (res.error) { console.error('getRequests:', res.error.message); return []; }
    return (res.data || []).map(function(b){
      return {
        id: b.id,
        initial: b.owner ? b.owner.initial : '?',
        gold: b.owner ? b.owner.avatar_gold : false,
        name: b.owner ? b.owner.full_name : 'Pet owner',
        pet: b.pet ? (b.pet.name + (b.pet.breed ? ' (' + b.pet.breed + ')' : '')) : '',
        kind: b.kind || 'house_sitting',
        note: b.note || '',
        dates: fmtRange(b.start_date, b.end_date),
        price: '$' + Number(b.total).toFixed(0)
      };
    });
  },

  /* All of this sitter's bookings (any status), for their dashboard. */
  async getSitterBookings() {
    if (!LIVE()) return window.MOCK.sitterBookings || [];
    var sid = await this.mySitterId();
    if (!sid) return [];
    var res = await sb.from('bookings')
      .select('id, start_date, end_date, total, status,' +
              ' owner:profiles!bookings_owner_id_fkey(full_name, initial, avatar_gold),' +
              ' pet:pets(name, breed)')
      .eq('sitter_id', sid)
      .order('start_date', { ascending:true });
    if (res.error) { console.error('getSitterBookings:', res.error.message); return []; }
    return (res.data || []).map(function(b){
      return {
        id: b.id, status: b.status,
        name: b.owner ? b.owner.full_name : 'Pet owner',
        initial: b.owner ? b.owner.initial : '?',
        gold: b.owner ? b.owner.avatar_gold : false,
        pet: b.pet ? b.pet.name : '',
        dates: fmtRange(b.start_date, b.end_date),
        total: Number(b.total)
      };
    });
  },

  /* Headline numbers for the sitter dashboard. */
  async getSitterStats() {
    if (!LIVE()) return { earnings: 0, upcoming: 0, rating: '5.0', pending: 0 };
    var sid = await this.mySitterId();
    if (!sid) return { earnings:0, upcoming:0, rating:'5.0', pending:0 };
    var bk = await sb.from('bookings').select('total, status, start_date').eq('sitter_id', sid);
    var rv = await sb.from('reviews').select('rating').eq('sitter_id', sid);
    var earnings = 0, upcoming = 0, pending = 0;
    var today = isoDate(new Date());
    (bk.data || []).forEach(function(b){
      if (b.status === 'completed') earnings += Number(b.total);
      if (b.status === 'accepted' && b.start_date >= today) upcoming++;
      if (b.status === 'pending') pending++;
    });
    var ratings = (rv.data || []).map(function(r){ return Number(r.rating); });
    var avg = ratings.length ? (ratings.reduce(function(a,b){return a+b;},0) / ratings.length) : 5;
    return { earnings: Math.round(earnings), upcoming: upcoming, rating: avg.toFixed(1), pending: pending };
  },

  /* accept / decline a request → updates the booking the owner sees. */
  async respondToRequest(bookingId, accept) {
    return this.setBookingStatus(bookingId, accept ? 'accepted' : 'declined');
  },

  /* ---- quiz + application status (sitter side) ---- */
  async getApplication() {
    if (!LIVE()) return window.MOCK.application || { status:'draft', quiz_score:null, quiz_passed:false, phone:'', address:'', home_type:'', has_yard:false, documents:{} };
    var sid = await this.mySitterId();
    if (!sid) return null;
    var res = await sb.from('sitter_profiles')
      .select('status, quiz_score, quiz_passed, applied_at, phone, address, home_type, has_yard, documents')
      .eq('id', sid).single();
    if (res.error) { console.error('getApplication:', res.error.message); return null; }
    return res.data;
  },

  /* Upload one document to the private sitter-docs bucket.
     Files live under <userId>/<kind>.<ext> so storage RLS can scope them. */
  async uploadDoc(kind, file) {
    if (!LIVE()) {
      // demo mode: just keep a local preview URL, no real upload
      window.MOCK.application = window.MOCK.application || { documents:{} };
      window.MOCK.application.documents = window.MOCK.application.documents || {};
      window.MOCK.application.documents[kind] = 'demo/' + kind;
      return { ok:true, path:'demo/' + kind };
    }
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in first.');
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var path = user.id + '/' + kind + '.' + ext;
    var up = await sb.storage.from('sitter-docs').upload(path, file, { upsert:true, contentType:file.type });
    if (up.error) throw up.error;
    return { ok:true, path:path };
  },

  /* Save the application details + document paths onto the sitter profile. */
  async saveApplication(details) {
    if (!LIVE()) {
      window.MOCK.application = Object.assign(window.MOCK.application || {}, details);
      return { ok:true };
    }
    var sid = await this.mySitterId();
    if (!sid) throw new Error('Set up your Paw Homie profile first.');
    var res = await sb.from('sitter_profiles').update({
      phone:     details.phone || null,
      address:   details.address || null,
      home_type: details.home_type || null,
      has_yard:  !!details.has_yard,
      documents: details.documents || {}
    }).eq('id', sid);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* A short-lived link to view a private document (admin review / preview). */
  async getDocUrl(path) {
    if (!LIVE() || !path) return null;
    var res = await sb.storage.from('sitter-docs').createSignedUrl(path, 3600);
    if (res.error) { console.error('getDocUrl:', res.error.message); return null; }
    return res.data ? res.data.signedUrl : null;
  },

  /* ---- OWNER identity verification ---- */
  async getOwnerVerification() {
    if (!LIVE()) return window.MOCK.ownerVerification || { id_status:'unverified', id_document:'' };
    var user = await this.currentUser();
    if (!user) return null;
    var res = await sb.from('profiles').select('id_status, id_document, id_submitted_at').eq('id', user.id).single();
    if (res.error) { console.error('getOwnerVerification:', res.error.message); return null; }
    return res.data;
  },

  /* Upload an owner document (kind: 'id' | 'pet-<petId>-vax') to owner-docs. */
  async uploadOwnerDoc(kind, file) {
    if (!LIVE()) {
      return { ok:true, path:'demo/' + kind };
    }
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in first.');
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var path = user.id + '/' + kind + '.' + ext;
    var up = await sb.storage.from('owner-docs').upload(path, file, { upsert:true, contentType:file.type });
    if (up.error) throw up.error;
    return { ok:true, path:path };
  },

  /* Submit the owner's ID for review → status pending. */
  async submitOwnerId(docPath) {
    if (!LIVE()) {
      window.MOCK.ownerVerification = { id_status:'pending', id_document:docPath };
      return { ok:true };
    }
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in first.');
    var res = await sb.from('profiles')
      .update({ id_document:docPath, id_status:'pending', id_submitted_at:new Date().toISOString() })
      .eq('id', user.id);
    if (res.error) throw res.error;
    return { ok:true };
  },

  async getOwnerDocUrl(path) {
    if (!LIVE() || !path) return null;
    var res = await sb.storage.from('owner-docs').createSignedUrl(path, 3600);
    if (res.error) { console.error('getOwnerDocUrl:', res.error.message); return null; }
    return res.data ? res.data.signedUrl : null;
  },

  /* Save a pet's vaccination record. */
  async savePetVaccination(petId, docPath, note) {
    if (!LIVE()) {
      var list = window.MOCK.pets || [];
      var p = list.find(function(x){ return x.id === petId; });
      if (p){ p.vaccination_doc = docPath; p.vaccination_status = 'on_file'; p.vaccination_note = note || ''; }
      return { ok:true };
    }
    var res = await sb.from('pets')
      .update({ vaccination_doc:docPath, vaccination_status:'on_file', vaccination_note:note || null })
      .eq('id', petId);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* ---- admin: owner ID review ---- */
  async getOwnerApplicants(which) {
    if (!LIVE()) return window.MOCK.ownerApplicants || [];
    var q = sb.from('profiles')
      .select('id, full_name, initial, avatar_gold, city, id_status, id_document, id_submitted_at')
      .neq('id_status', 'unverified').order('id_submitted_at', { ascending:true });
    if (which && which !== 'all') q = q.eq('id_status', which);
    var res = await q;
    if (res.error) { console.error('getOwnerApplicants:', res.error.message); return []; }
    return (res.data||[]).map(function(p){
      return { id:p.id, name:p.full_name||'Owner', initial:p.initial||'?', gold:!!p.avatar_gold,
               city:p.city||'', status:p.id_status, document:p.id_document||'' };
    });
  },

  async reviewOwnerId(ownerId, approve) {
    if (!LIVE()) {
      if (window.MOCK.ownerApplicants){
        var o = window.MOCK.ownerApplicants.find(function(x){ return x.id===ownerId; });
        if (o) o.status = approve ? 'verified' : 'rejected';
      }
      return { ok:true };
    }
    var res = await sb.from('profiles')
      .update({ id_status: approve ? 'verified' : 'rejected' }).eq('id', ownerId);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* Final step: the sitter has done details+docs+quiz, send it to the admin. */
  async submitForReview() {
    if (!LIVE()) {
      window.MOCK.application = Object.assign({}, window.MOCK.application || {}, { status:'pending' });
      return { ok:true };
    }
    var sid = await this.mySitterId();
    if (!sid) throw new Error('No sitter profile.');
    var res = await sb.from('sitter_profiles')
      .update({ status:'pending', applied_at:new Date().toISOString() }).eq('id', sid);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* Save the quiz result. Passing unlocks the application form but does
     NOT submit — the sitter still has to upload their documents. */
  async submitQuiz(scorePercent, passed) {
    if (!LIVE()) {
      var prev = window.MOCK.application || {};
      window.MOCK.application = Object.assign({}, prev, { quiz_score: scorePercent, quiz_passed: passed });
      return { ok:true };
    }
    var sid = await this.mySitterId();
    if (!sid) throw new Error('Set up your Paw Homie profile first.');
    var res = await sb.from('sitter_profiles')
      .update({ quiz_score: scorePercent, quiz_passed: passed }).eq('id', sid);
    if (res.error) throw res.error;
    return { ok:true, passed: passed };
  },


  /* ---- admin: review queue ---- */
  async getApplicants(which) {
    // which: 'pending' | 'approved' | 'rejected' | 'all'
    if (!LIVE()) return window.MOCK.applicants || [];
    var q = sb.from('sitter_profiles')
      .select('id, status, quiz_score, quiz_passed, about, rate_per_night, applied_at,' +
              ' phone, address, home_type, has_yard, documents,' +
              ' profile:profiles!sitter_profiles_profile_id_fkey(full_name, initial, avatar_gold, city)')
      .order('applied_at', { ascending:true });
    if (which && which !== 'all') q = q.eq('status', which);
    var res = await q;
    if (res.error) { console.error('getApplicants:', res.error.message); return []; }
    return (res.data || []).map(function(s){
      var p = s.profile || {};
      return {
        id: s.id, status: s.status, score: s.quiz_score, passed: s.quiz_passed,
        name: p.full_name || 'Applicant', initial: p.initial || '?', gold: !!p.avatar_gold,
        city: p.city || '', about: s.about || '', rate: Number(s.rate_per_night),
        phone: s.phone || '', address: s.address || '', home_type: s.home_type || '', has_yard: !!s.has_yard,
        documents: s.documents || {}
      };
    });
  },

  async reviewApplicant(sitterId, approve) {
    if (!LIVE()) {
      if (window.MOCK.applicants) {
        var a = window.MOCK.applicants.find(function(x){ return x.id === sitterId; });
        if (a) a.status = approve ? 'approved' : 'rejected';
      }
      return { ok:true };
    }
    var res = await sb.from('sitter_profiles')
      .update({ status: approve ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', sitterId);
    if (res.error) throw res.error;
    return { ok:true };
  },

  async getAdminCounts() {
    if (!LIVE()) return { pending:(window.MOCK.applicants||[]).filter(function(a){return a.status==='pending';}).length, approved:0, rejected:0 };
    var res = await sb.from('sitter_profiles').select('status');
    if (res.error) return { pending:0, approved:0, rejected:0 };
    var c = { pending:0, approved:0, rejected:0 };
    (res.data||[]).forEach(function(r){ if (c[r.status]!=null) c[r.status]++; });
    return c;
  },

  /* Platform-wide stats for the admin overview. */
  async getAdminStats() {
    if (!LIVE()) return { owners:128, sitters:34, pending:3, activeBookings:12, completed:210, revenue:2640, newsletter:87 };
    var out = { owners:0, sitters:0, pending:0, activeBookings:0, completed:0, revenue:0, newsletter:0 };
    var profs = await sb.from('profiles').select('is_owner, is_sitter');
    (profs.data||[]).forEach(function(p){ if (p.is_owner) out.owners++; if (p.is_sitter) out.sitters++; });
    var sp = await sb.from('sitter_profiles').select('status');
    (sp.data||[]).forEach(function(s){ if (s.status==='pending') out.pending++; });
    var bk = await sb.from('bookings').select('status, service_fee');
    (bk.data||[]).forEach(function(b){
      if (b.status==='accepted') out.activeBookings++;
      if (b.status==='completed'){ out.completed++; out.revenue += Number(b.service_fee||0); }
    });
    var nl = await sb.from('newsletter').select('email');
    out.newsletter = (nl.data||[]).length;
    out.revenue = Math.round(out.revenue);
    return out;
  },

  /* Every sitter, for the admin "Paw Homies" tab. */
  async getAllSitters() {
    if (!LIVE()) return window.MOCK.allSitters || [];
    var res = await sb.from('sitter_profiles')
      .select('id, status, published, quiz_score, rate_per_night, profile:profiles!sitter_profiles_profile_id_fkey(full_name, initial, avatar_gold, city)')
      .order('status');
    if (res.error) { console.error('getAllSitters:', res.error.message); return []; }
    return (res.data||[]).map(function(s){
      var p = s.profile || {};
      return { id:s.id, status:s.status, published:s.published, score:s.quiz_score, rate:Number(s.rate_per_night),
               name:p.full_name||'Paw Homie', initial:p.initial||'?', gold:!!p.avatar_gold, city:p.city||'' };
    });
  },

  /* Suspend = unpublish + mark rejected so they drop out of search. */
  async setSitterStatus(sitterId, status, published) {
    if (!LIVE()) return { ok:true };
    var patch = { status: status };
    if (published != null) patch.published = published;
    var res = await sb.from('sitter_profiles').update(patch).eq('id', sitterId);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* All bookings across the platform, for oversight. */
  async getAllBookings() {
    if (!LIVE()) return window.MOCK.allBookings || [];
    var res = await sb.from('bookings')
      .select('id, start_date, end_date, total, status, created_at,' +
              ' owner:profiles!bookings_owner_id_fkey(full_name, initial),' +
              ' sitter:sitter_profiles(profile:profiles!sitter_profiles_profile_id_fkey(full_name))')
      .order('created_at', { ascending:false }).limit(50);
    if (res.error) { console.error('getAllBookings:', res.error.message); return []; }
    return (res.data||[]).map(function(b){
      return { id:b.id, status:b.status, total:Number(b.total),
               owner:b.owner?b.owner.full_name:'Owner', initial:b.owner?b.owner.initial:'?',
               sitter:(b.sitter&&b.sitter.profile)?b.sitter.profile.full_name:'Paw Homie',
               dates:fmtRange(b.start_date, b.end_date) };
    });
  },

  /* Recent reviews for moderation. */
  async getAllReviews() {
    if (!LIVE()) return window.MOCK.allReviews || [];
    var res = await sb.from('reviews')
      .select('id, rating, body, created_at, author:profiles!reviews_author_id_fkey(full_name),' +
              ' sitter:sitter_profiles(profile:profiles!sitter_profiles_profile_id_fkey(full_name))')
      .order('created_at', { ascending:false }).limit(50);
    if (res.error) { console.error('getAllReviews:', res.error.message); return []; }
    return (res.data||[]).map(function(r){
      return { id:r.id, rating:r.rating, body:r.body||'',
               author:r.author?r.author.full_name:'Owner',
               sitter:(r.sitter&&r.sitter.profile)?r.sitter.profile.full_name:'Paw Homie' };
    });
  },

  async removeReview(id) {
    if (!LIVE()) { window.MOCK.allReviews = (window.MOCK.allReviews||[]).filter(function(r){return r.id!==id;}); return { ok:true }; }
    var res = await sb.from('reviews').delete().eq('id', id);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* File a report about a review / conversation / message. */
  async fileReport(kind, targetId, reason) {
    if (!LIVE()) return { ok:true };
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in first.');
    var res = await sb.from('reports').insert({
      reporter_id: user.id, kind: kind, target_id: targetId, reason: reason || null
    });
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* Sitter replies to a review left about them. */
  async replyToReview(reviewId, reply) {
    if (!LIVE()) return { ok:true };
    var res = await sb.from('reviews').update({ reply: reply }).eq('id', reviewId);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* Admin: open reports queue. */
  async getReports() {
    if (!LIVE()) return window.MOCK.reports || [];
    var res = await sb.from('reports')
      .select('id, kind, target_id, reason, status, created_at, reporter:profiles!reports_reporter_id_fkey(full_name)')
      .eq('status','open').order('created_at', { ascending:false });
    if (res.error) { console.error('getReports:', res.error.message); return []; }
    return (res.data||[]).map(function(r){
      return { id:r.id, kind:r.kind, targetId:r.target_id, reason:r.reason,
               reporter:r.reporter?r.reporter.full_name:'Someone' };
    });
  },

  async resolveReport(id) {
    if (!LIVE()) return { ok:true };
    var res = await sb.from('reports').update({ status:'reviewed' }).eq('id', id);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* ---- services & rates ---- */
  async getMyServices() {
    if (!LIVE()) return window.MOCK.myServices || [];
    var sid = await this.mySitterId();
    if (!sid) return [];
    var res = await sb.from('services').select('kind, price, enabled').eq('sitter_id', sid);
    if (res.error) { console.error('getMyServices:', res.error.message); return []; }
    return res.data || [];
  },

  async saveService(kind, price, enabled) {
    if (!LIVE()) return { ok:true };
    var sid = await this.mySitterId();
    if (!sid) throw new Error('Set up your Paw Homie profile first.');
    var res = await sb.from('services').upsert(
      { sitter_id: sid, kind: kind, price: price, enabled: enabled },
      { onConflict: 'sitter_id,kind' });
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* the nightly rate lives on sitter_profiles */
  async getSitterProfile() {
    if (!LIVE()) return window.MOCK.sitterProfile || { about:'', rate_per_night:40, published:false, tags:[] };
    var sid = await this.mySitterId();
    if (!sid) return null;
    var res = await sb.from('sitter_profiles')
      .select('about, rate_per_night, reply_time, tags, published, verified').eq('id', sid).single();
    if (res.error) { console.error('getSitterProfile:', res.error.message); return null; }
    return res.data;
  },

  async saveSitterProfile(patch) {
    if (!LIVE()) return { ok:true };
    var sid = await this.mySitterId();
    if (!sid) throw new Error('No sitter profile.');
    var res = await sb.from('sitter_profiles').update(patch).eq('id', sid);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* ---- availability ---- */
  async getMyAvailability(fromDate, toDate) {
    if (!LIVE()) return window.MOCK.availability || {};
    var sid = await this.mySitterId();
    if (!sid) return {};
    var res = await sb.from('availability').select('day, status')
      .eq('sitter_id', sid).gte('day', fromDate).lte('day', toDate);
    if (res.error) { console.error('getMyAvailability:', res.error.message); return {}; }
    var map = {};
    (res.data || []).forEach(function(r){ map[r.day] = r.status; });
    return map;
  },

  async setAvailability(day, status) {
    if (!LIVE()) { window.MOCK.availability = window.MOCK.availability || {}; window.MOCK.availability[day] = status; return { ok:true }; }
    var sid = await this.mySitterId();
    if (!sid) throw new Error('No sitter profile.');
    var res = await sb.from('availability').upsert(
      { sitter_id: sid, day: day, status: status },
      { onConflict: 'sitter_id,day' });
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* ---- Stripe payments (via secure Edge Functions) ---- */

  // Create a PaymentIntent that HOLDS the funds. Returns { clientSecret, id }.
  async createPaymentHold(amount, bookingId, description) {
    if (!LIVE()) return { clientSecret:'mock', id:'pi_mock' };
    var res = await sb.functions.invoke('create-payment', {
      body: { amount: amount, currency: 'cad', bookingId: bookingId, description: description }
    });
    if (res.error) throw new Error(res.error.message || 'Payment setup failed');
    if (res.data && res.data.error) throw new Error(res.data.error);
    return res.data;
  },

  // Save the payment intent + mark the booking as held.
  async attachPaymentToBooking(bookingId, intentId) {
    if (!LIVE()) return { ok:true };
    var res = await sb.from('bookings')
      .update({ payment_intent_id: intentId, payment_status: 'held' })
      .eq('id', bookingId);
    if (res.error) throw res.error;
    return { ok:true };
  },

  // Capture (release) or cancel a held payment. action: 'capture' | 'cancel'.
  async settlePayment(bookingId, intentId, action) {
    if (!LIVE()) return { ok:true };
    var res = await sb.functions.invoke('capture-payment', {
      body: { paymentIntentId: intentId, action: action }
    });
    if (res.error) throw new Error(res.error.message || 'Payment update failed');
    if (res.data && res.data.error) throw new Error(res.data.error);
    var patch = action === 'cancel'
      ? { payment_status: 'refunded' }
      : { payment_status: 'paid', paid_at: new Date().toISOString() };
    await sb.from('bookings').update(patch).eq('id', bookingId);
    return { ok:true };
  },

  async createBooking(payload) {
    if (!LIVE()) return { ok:true, mock:true };
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in to book.');
    var res = await sb.from('bookings').insert({
      owner_id:   user.id,
      sitter_id:  payload.sitterId,
      pet_id:     payload.petId || null,
      start_date: payload.startDate,
      end_date:   payload.endDate,
      subtotal:   payload.subtotal,
      service_fee:payload.serviceFee,
      tax:        payload.tax || 0,
      total:      payload.total,
      note:       payload.note || null
    }).select().single();
    if (res.error) throw res.error;
    return { ok:true, booking:res.data };
  },

  async setBookingStatus(id, status) {
    if (!LIVE()) return { ok:true };
    var res = await sb.from('bookings').update({ status: status }).eq('id', id);
    if (res.error) throw res.error;

    // Settle the held payment when the booking reaches a final state.
    try {
      if (status === 'completed' || status === 'cancelled' || status === 'declined') {
        var b = await sb.from('bookings').select('payment_intent_id, payment_status').eq('id', id).single();
        var pi = b.data && b.data.payment_intent_id;
        var ps = b.data && b.data.payment_status;
        if (pi && ps === 'held') {
          var action = (status === 'completed') ? 'capture' : 'cancel';
          await this.settlePayment(id, pi, action);
        }
      }
    } catch(e){ console.error('settle on status change:', e.message); }

    return { ok:true };
  },

  /* One booking, fully detailed, for the booking-detail page. */
  async getBooking(id) {
    if (!LIVE()){
      var b = (window.MOCK.myBookings || []).find(function(x){ return x.id === id; });
      return b || null;
    }
    var res = await sb.from('bookings')
      .select('id, start_date, end_date, subtotal, service_fee, tax, total, status, note, created_at,' +
              ' pet:pets(name, species, breed),' +
              ' sitter:sitter_profiles(id, profile:profiles!sitter_profiles_profile_id_fkey(full_name, initial, avatar_gold)),' +
              ' review:reviews(id, rating)')
      .eq('id', id).single();
    if (res.error){ console.error('getBooking:', res.error.message); return null; }
    var b = res.data, p = b.sitter && b.sitter.profile ? b.sitter.profile : {};
    return {
      id: b.id,
      sitterProfileId: b.sitter ? b.sitter.id : null,
      sitterName: p.full_name || 'Paw Homie',
      initial: p.initial || '?',
      gold: !!p.avatar_gold,
      petName: b.pet ? b.pet.name : '',
      startDate: b.start_date, endDate: b.end_date,
      subtotal: Number(b.subtotal), fee: Number(b.service_fee),
      tax: Number(b.tax || 0), total: Number(b.total),
      status: b.status, note: b.note, createdAt: b.created_at,
      hasReview: !!(b.review && b.review.length),
      reviewRating: b.review && b.review.length ? b.review[0].rating : null
    };
  },

  async cancelBooking(id) {
    return this.setBookingStatus(id, 'cancelled');
  },

  /* Change a booking's dates (owner, while pending/accepted). Recomputes totals. */
  async rescheduleBooking(id, startDate, endDate, rate) {
    if (!LIVE()) return { ok:true };
    var q = Booking.quoteFor(rate, startDate, endDate);
    var res = await sb.from('bookings').update({
      start_date: startDate, end_date: endDate,
      subtotal: q.subtotal, service_fee: q.fee, tax: q.tax, total: q.total,
      status: 'pending'   // re-requesting new dates needs sitter to re-accept
    }).eq('id', id);
    if (res.error) throw res.error;
    return { ok:true };
  },

  /* ---- reviews ---- */
  async addReview(review) {
    if (!LIVE()) { window.MOCK.lastReview = review; return { ok:true, mock:true }; }
    var user = await this.currentUser();
    if (!user) throw new Error('Please sign in first.');
    var res = await sb.from('reviews').insert({
      booking_id: review.bookingId || null,
      author_id:  user.id,
      sitter_id:  review.sitterId,
      rating:     review.rating,
      body:       review.body || null
    }).select().single();
    if (res.error) throw res.error;
    return { ok:true, review:res.data };
  },

  /* ---- notifications ---- */
  async getNotifications() {
    if (!LIVE()) return window.MOCK.notifications || [];
    var user = await this.currentUser();
    if (!user) return [];
    var res = await sb.from('notifications')
      .select('id, title, body, read, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending:false })
      .limit(30);
    if (res.error){ console.error('getNotifications:', res.error.message); return []; }
    return res.data || [];
  },

  async markNotificationsRead() {
    if (!LIVE()) return { ok:true };
    var user = await this.currentUser();
    if (!user) return { ok:true };
    var res = await sb.from('notifications').update({ read:true }).eq('profile_id', user.id).eq('read', false);
    if (res.error) console.error('markNotificationsRead:', res.error.message);
    return { ok:true };
  },

  /* ---- availability ---- */
  async getAvailability(sitterId) {
    if (!LIVE()) return [];
    var res = await sb.from('availability').select('day, status').eq('sitter_id', sitterId).order('day');
    if (res.error) { console.error('getAvailability:', res.error.message); return []; }
    return res.data || [];
  }
};
